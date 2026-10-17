BEGIN;
CREATE TABLE IF NOT EXISTS public.projects_sync_operations (
 user_id uuid NOT NULL REFERENCES auth.users(id),
 operation_id uuid NOT NULL,
 changes jsonb NOT NULL,
 result jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id, operation_id)
);
ALTER TABLE public.projects_sync_operations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS own_receipts ON public.projects_sync_operations;
CREATE POLICY own_receipts ON public.projects_sync_operations FOR SELECT TO authenticated USING (user_id=auth.uid());
REVOKE ALL ON public.projects_sync_operations FROM public, anon, authenticated;
GRANT SELECT ON public.projects_sync_operations TO authenticated;
CREATE OR REPLACE FUNCTION public.commit_projects_changes(operation_id uuid, changes jsonb, owner_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE
 actor uuid := auth.uid();
 op_id uuid := operation_id;
 submitted jsonb := changes;
 state jsonb; ver integer; prior jsonb; result_value jsonb;
 change jsonb; coll text; rid text; path text[]; rows jsonb; idx integer;
 current_record jsonb; base_record jsonb; desired jsonb; merged jsonb;
 field text; conflict boolean; changed boolean := false; fields_changed boolean;
 issues jsonb := '[]'; applied integer := 0;
BEGIN
 IF actor IS NULL OR actor IS DISTINCT FROM owner_id THEN RAISE EXCEPTION 'Sign in required' USING ERRCODE='28000'; END IF;
 IF op_id IS NULL OR jsonb_typeof(submitted) IS DISTINCT FROM 'array' OR jsonb_array_length(submitted)>1000 OR pg_column_size(submitted)>10000000 THEN RAISE EXCEPTION 'Invalid sync operation' USING ERRCODE='22023'; END IF;
 SELECT w.payload,w.version INTO state,ver FROM public.projects_workspaces w WHERE w.user_id=actor FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Projects workspace not found' USING ERRCODE='22023'; END IF;
 SELECT o.result INTO prior FROM public.projects_sync_operations o WHERE o.user_id=actor AND o.operation_id=op_id;
 IF FOUND THEN
  IF (SELECT o.changes FROM public.projects_sync_operations o WHERE o.user_id=actor AND o.operation_id=op_id) IS DISTINCT FROM submitted THEN RAISE EXCEPTION 'Operation ID reused with different changes' USING ERRCODE='22023'; END IF;
  RETURN prior;
 END IF;
 FOR change IN SELECT value FROM jsonb_array_elements(submitted) LOOP
  coll:=change->>'collection';rid:=change->>'id';base_record:=nullif(change->'before','null');desired:=change->'after';conflict:=false;
  IF coll IS NULL OR coll NOT IN ('tasks','captures','milestones','notes','projects','preferences','projectStatus') OR rid IS NULL OR rid='' OR jsonb_typeof(desired) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Invalid change' USING ERRCODE='22023'; END IF;
  IF base_record IS NOT NULL AND jsonb_typeof(base_record) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Invalid base record' USING ERRCODE='22023'; END IF;
  IF coll IN ('preferences','projectStatus') THEN
   IF NOT(desired ? 'value') OR NOT(base_record ? 'value') THEN RAISE EXCEPTION 'Invalid summary value' USING ERRCODE='22023'; END IF;
   IF coll='preferences' AND rid NOT IN ('activeProjectWorkspace','seedTasksV1','commercialProjectsSeedV1') THEN RAISE EXCEPTION 'Invalid preference'; END IF;
   IF coll='projectStatus' AND rid NOT IN ('currentFocus','currentStage','nextAction','overallProgress') THEN RAISE EXCEPTION 'Invalid project summary'; END IF;
   current_record:=jsonb_build_object('value',state#>ARRAY[coll,rid]);
   IF current_record=desired THEN applied:=applied+1;CONTINUE;END IF;
   IF current_record IS DISTINCT FROM base_record THEN
    issues:=issues||jsonb_build_array(jsonb_build_object('collection',coll,'id',rid,'before',base_record,'after',desired,'remote',current_record));CONTINUE;
   END IF;
   state:=jsonb_set(state,ARRAY[coll],coalesce(state->coll,'{}'),true);
   state:=jsonb_set(state,ARRAY[coll,rid],desired->'value',true);changed:=true;applied:=applied+1;CONTINUE;
  END IF;
  IF desired->>'id' IS DISTINCT FROM rid OR (base_record IS NOT NULL AND base_record->>'id' IS DISTINCT FROM rid) THEN RAISE EXCEPTION 'Record ID mismatch';END IF;
  IF coll<>'projects' AND (desired->>'type' IS NULL OR desired->>'type' NOT IN ('Task','Milestone','Note','Idea') OR desired->>'title' IS NULL) THEN RAISE EXCEPTION 'Invalid record';END IF;
  IF coll='projects' AND desired->>'name' IS NULL THEN RAISE EXCEPTION 'Invalid project';END IF;
  path:=CASE WHEN coll='projects' THEN ARRAY['projects'] ELSE ARRAY['records',coll] END;
  rows:=coalesce(state#>path,'[]');
  SELECT (ordinality-1)::integer,value INTO idx,current_record FROM jsonb_array_elements(rows) WITH ORDINALITY WHERE value->>'id'=rid LIMIT 1;
  IF NOT FOUND THEN
   IF base_record IS NOT NULL THEN conflict:=true;
   ELSE IF desired ? 'status' THEN desired:=jsonb_set(desired,'{syncStatusRevision}',to_jsonb(op_id::text),true);END IF;rows:=rows||jsonb_build_array(desired);state:=jsonb_set(state,path,rows,true);changed:=true;applied:=applied+1;CONTINUE;END IF;
  ELSIF base_record IS NULL THEN
   IF (current_record-'syncStatusRevision'-'updatedAt')=(desired-'syncStatusRevision'-'updatedAt') THEN applied:=applied+1;CONTINUE;ELSE conflict:=true;END IF;
  ELSE
   merged:=current_record;fields_changed:=false;
   IF (current_record->'deletedAt') IS DISTINCT FROM (base_record->'deletedAt') AND (current_record->'deletedAt') IS DISTINCT FROM (desired->'deletedAt') THEN conflict:=true;END IF;
   IF (desired->'deletedAt') IS DISTINCT FROM (base_record->'deletedAt') AND (current_record-'updatedAt'-'syncStatusRevision') IS DISTINCT FROM (base_record-'updatedAt'-'syncStatusRevision') AND (current_record-'updatedAt'-'syncStatusRevision') IS DISTINCT FROM (desired-'updatedAt'-'syncStatusRevision') THEN conflict:=true;END IF;
   IF (desired->'status') IS DISTINCT FROM (base_record->'status') AND (current_record->'status') IS DISTINCT FROM (desired->'status') AND (current_record->'syncStatusRevision') IS DISTINCT FROM (base_record->'syncStatusRevision') THEN conflict:=true;END IF;
   FOR field IN SELECT key FROM jsonb_object_keys(base_record||desired) AS key LOOP
    IF field IN ('id','createdAt','updatedAt','syncStatusRevision') OR (base_record->field) IS NOT DISTINCT FROM (desired->field) THEN CONTINUE;END IF;
    IF (current_record->field) IS DISTINCT FROM (base_record->field) AND (current_record->field) IS DISTINCT FROM (desired->field) THEN conflict:=true;END IF;
    IF desired ? field THEN merged:=jsonb_set(merged,ARRAY[field],desired->field,true);ELSE merged:=merged-field;END IF;
    fields_changed:=true;
   END LOOP;
   IF NOT conflict THEN
    IF fields_changed AND merged IS DISTINCT FROM current_record THEN
     merged:=jsonb_set(merged,'{updatedAt}',to_jsonb(now()::text),true);
     IF (desired->'status') IS DISTINCT FROM (base_record->'status') OR (desired->'deletedAt') IS DISTINCT FROM (base_record->'deletedAt') THEN merged:=jsonb_set(merged,'{syncStatusRevision}',to_jsonb(op_id::text),true);END IF;
     rows:=jsonb_set(rows,ARRAY[idx::text],merged);state:=jsonb_set(state,path,rows,true);changed:=true;
    END IF;
    applied:=applied+1;CONTINUE;
   END IF;
  END IF;
  IF conflict THEN issues:=issues||jsonb_build_array(jsonb_build_object('collection',coll,'id',rid,'before',base_record,'after',desired,'remote',current_record));END IF;
 END LOOP;
 IF changed THEN
  IF pg_column_size(state)>10000000 THEN RAISE EXCEPTION 'Workspace size limit';END IF;
  state:=jsonb_set(state,'{savedAt}',to_jsonb(now()::text),true);
  UPDATE public.projects_workspaces SET payload=state,version=version+1,updated_at=now() WHERE user_id=actor RETURNING version INTO ver;
 END IF;
 result_value:=jsonb_build_object('operationId',op_id,'version',ver,'applied',applied,'conflicts',issues);
 INSERT INTO public.projects_sync_operations(user_id,operation_id,changes,result) VALUES(actor,op_id,submitted,result_value);
 RETURN result_value;
END $fn$;
REVOKE ALL ON FUNCTION public.commit_projects_changes(uuid,jsonb,uuid) FROM public,anon;
GRANT EXECUTE ON FUNCTION public.commit_projects_changes(uuid,jsonb,uuid) TO authenticated;
-- Old full snapshot clients must upgrade instead of bypassing field conflict checks.
CREATE OR REPLACE FUNCTION public.save_projects_workspace(expected_version integer,new_payload jsonb)
RETURNS integer LANGUAGE plpgsql SET search_path='' AS $fn$
BEGIN RAISE EXCEPTION 'Reload Projects or FLOW to use the upgraded sync. Pending browser work is retained.' USING ERRCODE='55000';END $fn$;
-- Preserve first account migration without enabling stale whole workspace updates.
CREATE OR REPLACE FUNCTION public.initialise_projects_workspace(owner_id uuid, operation_id uuid, new_payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE actor uuid:=auth.uid(); inserted_version integer; prior jsonb; record_group text;
BEGIN
 IF actor IS NULL OR actor IS DISTINCT FROM owner_id THEN RAISE EXCEPTION 'Sign in required' USING ERRCODE='28000'; END IF;
 IF operation_id IS NULL OR new_payload->>'schemaVersion' IS DISTINCT FROM '1' OR pg_column_size(new_payload)>10000000 THEN RAISE EXCEPTION 'Invalid Projects workspace' USING ERRCODE='22023';END IF;
 FOREACH record_group IN ARRAY ARRAY['tasks','captures','milestones','notes'] LOOP
  IF jsonb_typeof(new_payload#>ARRAY['records',record_group]) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Invalid records' USING ERRCODE='22023';END IF;
  IF EXISTS(SELECT 1 FROM jsonb_array_elements(new_payload#>ARRAY['records',record_group]) r WHERE r->>'id' IS NULL OR r->>'title' IS NULL OR r->>'type' IS NULL) THEN RAISE EXCEPTION 'Invalid record';END IF;
  IF (SELECT count(*) FROM jsonb_array_elements(new_payload#>ARRAY['records',record_group]))<>(SELECT count(DISTINCT r->>'id') FROM jsonb_array_elements(new_payload#>ARRAY['records',record_group]) r) THEN RAISE EXCEPTION 'Duplicate record ID';END IF;
 END LOOP;
 SELECT o.result INTO prior FROM public.projects_sync_operations o WHERE o.user_id=actor AND o.operation_id=initialise_projects_workspace.operation_id;
 IF FOUND THEN
  IF (SELECT o.changes FROM public.projects_sync_operations o WHERE o.user_id=actor AND o.operation_id=initialise_projects_workspace.operation_id) IS DISTINCT FROM jsonb_build_array(jsonb_build_object('initialPayload',new_payload)) THEN RAISE EXCEPTION 'Operation ID reused';END IF;
  RETURN prior;
 END IF;
 INSERT INTO public.projects_workspaces(user_id,payload,version) VALUES(actor,new_payload,1) ON CONFLICT DO NOTHING RETURNING version INTO inserted_version;
 IF inserted_version IS NULL THEN RAISE EXCEPTION 'Workspace already exists. Load its current records before saving.' USING ERRCODE='55000';END IF;
 prior:=jsonb_build_object('operationId',operation_id,'version',1,'applied',1,'conflicts','[]'::jsonb);
 INSERT INTO public.projects_sync_operations(user_id,operation_id,changes,result) VALUES(actor,operation_id,jsonb_build_array(jsonb_build_object('initialPayload',new_payload)),prior);
 RETURN prior;
END $fn$;
REVOKE ALL ON FUNCTION public.initialise_projects_workspace(uuid,uuid,jsonb) FROM public,anon;
GRANT EXECUTE ON FUNCTION public.initialise_projects_workspace(uuid,uuid,jsonb) TO authenticated;
-- All supported writes use account checked functions, never an unguarded REST update.
REVOKE INSERT,UPDATE,DELETE ON public.projects_workspaces FROM anon,authenticated;
COMMIT;
