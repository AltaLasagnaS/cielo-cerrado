/** Evidence boundary: game associations cannot silently enable real weapons. */
export function validateDatabaseReview(review) {
  const errors = [], fail = message => errors.push(message), builds = new Set();
  const integer = value => Number.isSafeInteger(value) && value >= 0;
  if (review?.format !== 'cielo-cerrado/db3k-selected-review' || review.version !== 1
      || review.runtimeEnabled !== false || !Array.isArray(review.builds)) return { ok: false, errors: ['Revisión de base inválida'] };
  for (const build of review.builds) {
    if (!build || !integer(build.buildLabel) || builds.has(build.buildLabel)) { fail('Build inválido o repetido'); continue; }
    builds.add(build.buildLabel);
    if (build.versionBasis !== 'supplied-filename' || build.verifiedInternalBuild !== null
        || build.role !== 'game-database' || build.confidence !== 'medium-low'
        || !/^[a-f0-9]{64}$/.test(build.sha256 ?? '') || !Array.isArray(build.records)) {
      fail('Procedencia de base inválida'); continue;
    }
    const ids = new Set();
    for (const record of build.records) {
      if (!record || !['DataWeapon', 'DataMount', 'DataSensor'].includes(record.table)
          || !integer(record.componentId) || record.componentId === 0) { fail('Identidad de registro inválida'); continue; }
      const key = `${record.table}:${record.componentId}`;
      if (ids.has(key)) fail('ID repetido dentro de build/tabla'); ids.add(key);
      if (record.runtimeEnabled !== false || record.normalizedPhysicalParameters !== null
          || !Array.isArray(record.missingColumns)) fail('No convertir datos crudos en catálogo activo');
      if (record.present === false) {
        if (record.rawFields !== null) fail('Registro ausente con datos atribuidos');
        continue;
      }
      if (record.present !== true || record.rawFields?.ID !== record.componentId
          || typeof record.rawFields?.Name !== 'string') fail('Registro presente sin identidad comprobable');
      for (const field of record.missingColumns) {
        if (record.rawFields?.[field] !== null) fail('Columna ausente completada');
      }
      if (record.table === 'DataWeapon' && (record.seekerGimbalDegrees !== null
          || record.terminalLateralAccelerationMps2 !== null)) fail('Haz del radar no acredita gimbal ni aceleración terminal');
      if (record.sensorCodes !== undefined) {
        if (record.table !== 'DataSensor' || !Array.isArray(record.sensorCodes)) fail('Códigos de sensor inválidos');
        else {
          const codes = new Set();
          for (const code of record.sensorCodes) {
            if (!integer(code.CodeID) || code.CodeID === 0 || codes.has(code.CodeID)
                || !(typeof code.Description === 'string' || code.Description === null)) fail('Código de sensor inválido/repetido');
            codes.add(code.CodeID);
          }
        }
      }
      if (record.table === 'DataMount') {
        if (record.realLauncherCompatibility !== null || !Array.isArray(record.weaponRecords)) fail('Carga del juego no certifica hardware');
        for (const load of record.weaponRecords ?? []) {
          if (!integer(load.DefaultLoad) || !integer(load.MaxLoad) || load.DefaultLoad > load.MaxLoad
              || !integer(load.weaponId) || load.weaponId === 0 || !integer(load.recordId)) fail('Carga de juego inválida');
        }
      }
    }
  }
  return { ok: errors.length === 0, errors };
}
