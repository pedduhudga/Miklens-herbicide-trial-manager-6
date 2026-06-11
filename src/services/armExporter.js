// src/services/armExporter.js
// Converts Miklens Trial data to standard ARM (Agricultural Research Manager) exchange CSV formats.

import { getCategoryConfig, getPrimaryObservationField } from '../utils/categoryConfig.js';
import { safeJsonParse } from '../utils/helpers.js';

export function exportToARM(trialOrTrials, category, project = null) {
  const trials = Array.isArray(trialOrTrials) ? trialOrTrials : [trialOrTrials];
  const config = getCategoryConfig(category);

  const csvRows = [];
  // Standard ARM exchange data headers
  csvRows.push([
    'ARM_TRIAL_ID',
    'CATEGORY',
    'PROJECT_NAME',
    'TREATMENT_NAME',
    'DOSAGE_RATE',
    'APPLICATION_TIMING',
    'PLOT_NUMBER',
    'REPLICATION',
    'INVESTIGATOR',
    'LOCATION',
    'DATE',
    'DAA',
    'METRIC_NAME',
    'VALUE',
    'NOTES'
  ].join(','));

  trials.forEach(t => {
    const eff = safeJsonParse(t.EfficacyDataJSON, []);
    const prjName = project ? project.Name : (t.ProjectID || 'Ungrouped');
    const trtName = t.FormulationName || 'Untreated Check';
    const rate = t.Dosage || '0';
    const timing = t.ApplicationTiming || 'N/A';
    const plot = t.PlotNumber || '101';
    const rep = t.Replication || '1';
    const inv = t.InvestigatorName || 'N/A';
    const loc = t.Location || 'N/A';
    const dt = t.Date || 'N/A';

    eff.forEach(obs => {
      const daa = obs.daa ?? 0;
      const notes = (obs.notes || '').replace(/"/g, '""');

      // Export observation values for all numeric metrics configured for this category
      config.observationFields.forEach(field => {
        if (field.type === 'weedArray') return;
        const val = obs[field.key] ?? '';
        if (val !== '') {
          csvRows.push([
            t.ID,
            category,
            `"${prjName.replace(/"/g, '""')}"`,
            `"${trtName.replace(/"/g, '""')}"`,
            `"${rate.replace(/"/g, '""')}"`,
            `"${timing.replace(/"/g, '""')}"`,
            plot,
            rep,
            `"${inv.replace(/"/g, '""')}"`,
            `"${loc.replace(/"/g, '""')}"`,
            dt.split('T')[0],
            daa,
            `"${field.label}"`,
            val,
            `"${notes}"`
          ].join(','));
        }
      });
    });
  });

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  return blob;
}
