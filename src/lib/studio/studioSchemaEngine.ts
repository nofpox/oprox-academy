/**
 * OPROX Studio Phase 1 — Studio Schema Builder Engine
 * Validates relational schema models, primary keys, foreign keys, and duplicate definitions.
 */

import { StudioSchemaModel } from './studioIr';

export interface SchemaValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateStudioSchemaModel(model: StudioSchemaModel): SchemaValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!model || typeof model !== 'object' || !Array.isArray(model.tables)) {
    return { valid: false, errors: ['Schema model must contain a "tables" array.'], warnings: [] };
  }

  const tableSet = new Set<string>();

  for (const table of model.tables) {
    if (!table.name || typeof table.name !== 'string') {
      errors.push('Table definition missing string "name".');
      continue;
    }

    if (tableSet.has(table.name)) {
      errors.push(`Duplicate table name detected in schema: "${table.name}"`);
    } else {
      tableSet.add(table.name);
    }

    if (!Array.isArray(table.columns) || table.columns.length === 0) {
      errors.push(`Table "${table.name}" must contain at least one column.`);
      continue;
    }

    const columnSet = new Set<string>();
    let hasPk = false;

    for (const col of table.columns) {
      if (!col.name || typeof col.name !== 'string') {
        errors.push(`Table "${table.name}" contains column with missing "name".`);
        continue;
      }

      if (columnSet.has(col.name)) {
        errors.push(`Table "${table.name}" contains duplicate column name: "${col.name}"`);
      } else {
        columnSet.add(col.name);
      }

      if (col.isPrimaryKey) {
        hasPk = true;
      }

      if (col.referencesTable) {
        if (!tableSet.has(col.referencesTable) && !model.tables.some((t) => t.name === col.referencesTable)) {
          warnings.push(
            `Table "${table.name}" column "${col.name}" references non-existent table "${col.referencesTable}".`
          );
        }
      }
    }

    if (!hasPk) {
      warnings.push(`Table "${table.name}" has no primary key defined.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
