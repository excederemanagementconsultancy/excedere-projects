/* Reusable repeat controls for private and authorized project task editors. */
(function(root) {
  'use strict';
  function attach(form, record = {}) {
    const engine = root.ExcedereRecurrence;
    if (!document.getElementById('recurrence-control-style')) {
      const style = document.createElement('style'); style.id = 'recurrence-control-style';
      style.textContent = '.recurrence-controls{min-width:0;margin:20px 0;padding:16px;border:1px solid #354655;border-radius:10px}.recurrence-controls [hidden]{display:none!important}.recurrence-controls .recurrence-days{display:flex;flex-wrap:wrap;gap:8px 16px}.recurrence-controls .recurrence-days label{display:flex;align-items:center;gap:8px}.recurrence-controls input[type=checkbox]{display:inline-block;width:18px;height:18px;margin:0;accent-color:#27b7cc}.recurrence-controls .form-note{line-height:1.5;overflow-wrap:anywhere}';
      document.head.append(style);
    }
    const rule = record.recurrence || {};
    const box = document.createElement('fieldset'); box.className = 'recurrence-controls';
    const legend = document.createElement('legend'); legend.textContent = 'Repeat schedule'; box.append(legend);
    const make = (label, type, value) => {
      const wrap = document.createElement('label'), input = document.createElement(type === 'select' ? 'select' : 'input');
      wrap.textContent = label;
      if (type !== 'select') input.type = type;
      input.value = value || ''; wrap.append(input); box.append(wrap); return input;
    };
    const frequency = make('Repeat','select');
    for (const [value,label] of [['none','None'],['daily','Every calendar day, including weekends'],['weekdays','Weekdays, Monday to Friday'],['weekly','Weekly on selected days'],['interval','Custom interval'],['monthly','Monthly']]) frequency.append(new Option(label,value));
    frequency.value = rule.frequency || 'none';
    const days = document.createElement('div'); days.className = 'recurrence-days'; days.setAttribute('aria-label','Repeat on these days'); box.append(days);
    const checks = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map((name,index) => {
      const label = document.createElement('label'), input = document.createElement('input'); input.type = 'checkbox'; input.checked = (rule.weekdays || []).includes(index); label.append(input,document.createTextNode(name)); days.append(label); return input;
    });
    const interval = make('Repeat every','number',rule.interval || 1); interval.min = '1'; interval.max = '999'; interval.step = '1';
    const unit = make('Interval unit','select'); for (const value of ['days','weeks','months']) unit.append(new Option(value,value)); unit.value = rule.unit || 'days';
    const start = make('Repeat from','date',rule.startDate || record.dueDate || engine.today()); start.required = true; start.disabled = !!record.recurrence;
    const end = make('End date, optional','date',rule.endDate);
    const time = make('Reminder time in FLOW, optional','time',rule.reminderTime);
    const zone = make('Schedule time zone','text',rule.timeZone || 'America/New_York'); zone.required = true;
    const note = document.createElement('p'); note.className = 'form-note'; note.textContent = 'Calendar dates follow this time zone. Monthly repeats use the last day when needed. Reminder time appears in FLOW; background alerts are not enabled. Editing a repeat schedule preserves elapsed dates and saved occurrence history.'; box.append(note);
    form.append(box);
    function display() {
      const enabled = frequency.value !== 'none';
      days.hidden = frequency.value !== 'weekly';
      for (const input of [interval,unit]) { input.parentElement.hidden = frequency.value !== 'interval'; input.disabled = frequency.value !== 'interval'; }
      for (const input of [start,end,time,zone]) { input.parentElement.hidden = !enabled; input.disabled = !enabled || (input === start && !!record.recurrence); }
    }
    frequency.addEventListener('change',display); display();
    return () => {
      if (frequency.value === 'none' && !record.recurrence) return null;
      return engine.validate({version:1,frequency:frequency.value,startDate:rule.startDate || start.value,endDate:frequency.value === 'none' ? '' : end.value,timeZone:zone.value.trim() || rule.timeZone || 'America/New_York',reminderTime:time.value,interval:Number(interval.value),unit:unit.value,weekdays:checks.flatMap((input,index) => input.checked ? [index] : [])});
    };
  }
  root.ExcedereRecurrenceForm = {attach};
})(globalThis);
