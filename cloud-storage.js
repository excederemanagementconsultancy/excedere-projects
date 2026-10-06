/* Supabase cloud storage for Excedere Projects. */
(() => {
  'use strict';

  class ProjectsCloudRepository {
    constructor(client, userId) {
      this.client = client;
      this.userId = userId;
      this.version = 0;
    }

    validate(payload) {
      if (!payload || typeof payload !== 'object') {
        throw new Error('Invalid Projects workspace.');
      }

      if (Number(payload.schemaVersion) !== 1) {
        throw new Error('Unsupported Projects workspace version.');
      }

      return payload;
    }

    async load() {
      const { data, error } = await this.client
        .from('projects_workspaces')
        .select('payload, version')
        .eq('user_id', this.userId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        this.version = 0;
        return null;
      }

      this.version = data.version;

      return this.validate(
        structuredClone(data.payload)
      );
    }

    async save(payload) {
      this.validate(payload);

      const { data, error } =
        await this.client.rpc(
          'save_projects_workspace',
          {
            expected_version: this.version,
            new_payload: payload
          }
        );

      if (error) {
        throw error;
      }

      this.version = Number(data);

      return this.version;
    }
  }

  window.ProjectsCloudRepository =
    ProjectsCloudRepository;
})();
