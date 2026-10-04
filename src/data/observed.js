// @ts-check
// Tasas de intercepción reportadas (nivel nacional salvo que se indique). Se muestran en la ficha.
// [período, lanzados, derribados, tasa, fuente, nota]
export const OBS = {
  shahed: [['feb-22 → ago-24', 13315, 8836, '63%', 'syrskyi', 'Shahed + Lancet'], ['mar → may-25', 7974, 4188, '52% derribo + 35% EW', 'isis_may25', 'incluye señuelos; 12,5% impactaron'], ['ago-25 → may-26', null, null, '83% → 93% neutralizados', 'isis_month', 'derribos + supresión EW'], ['jul-26', null, null, '87%', 'tt_jul26', 'todos los drones']],
  geran3: [],
  gerbera: [['2025', 54538, null, '—', 'isis_2025', '~40% de los drones tipo Shahed eran señuelos']],
  kh101: [['feb-22 → ago-24', null, null, '67%', 'syrskyi', 'crucero agrupado (Kalibr, Kh-101/555, Iskander-K)'], ['nov-25', 108, null, '70–85%', 'kd_monitor', 'crucero agrupado'], ['jul-26', 265, 187, '71%', 'tt_jul26', 'crucero agrupado'], ['feb-22 → feb-26', null, 2459, '—', 'isw_feb26', 'derribados acumulados']],
  kalibr: [['feb-22 → ago-24', null, null, '67%', 'syrskyi', 'crucero agrupado'], ['jul-26', 265, 187, '71%', 'tt_jul26', 'crucero agrupado'], ['feb-22 → feb-26', null, 709, '—', 'isw_feb26', 'derribados acumulados']],
  isk_k: [['feb-22 → ago-24', null, null, '67%', 'syrskyi', 'crucero agrupado'], ['feb-22 → feb-26', null, 261, '—', 'isw_feb26', 'derribados acumulados']],
  isk_m: [['feb-22 → ago-24', 1388, 62, '4,5%', 'syrskyi', 'incluye Tochka-U y KN-23, en su mayoría fuera de cobertura Patriot'], ['ene → may-25', 128, 20, '15%', 'rusi_isk25', 'Iskander-M + KN-23'], ['jun → sep-25', 179, 67, '37%', 'rusi_isk25', 'Iskander-M + Kinzhal'], ['sep-25', null, null, '6%', 'ft_aerotime', 'tras la actualización de maniobra'], ['1 → 24 oct-25', 78, 14, '17%', 'rusi_isk25', ''], ['jul-26', 195, 29, '15%', 'tt_jul26', 'escasez de PAC-3 MSE']],
  kinzhal: [['16 may-23 (Kyiv)', 6, 6, '100% (reclamado)', 'aerotime_k', 'junto con 9 Kalibr y 3 Iskander'], ['feb-22 → ago-24', 111, 28, '25%', 'syrskyi', ''], ['hasta 24 oct-25', 939, 227, '24%', 'rusi_isk25', 'Iskander-M + Kinzhal']],
  kh22: [['feb-22 → ago-24', 362, 2, '0,55%', 'syrskyi', 'Kh-22 + Kh-32'], ['2 feb-26 (Kyiv)', 12, 9, '75%', 'rbc_kh22', 'un solo ataque, dentro de cobertura Patriot']],
  oniks: [['feb-22 → ago-24', 211, 12, '5,7%', 'syrskyi', '']],
  zircon: [['feb-22 → ago-24', 6, 2, '33%', 'syrskyi', ''], ['25 mar-24 (Kyiv)', 2, 2, '100%', 'nv_zircon', 'SAMP/T y Patriot']],
  storm: [['2023', null, null, 'sin dato', 'dmn_storm', 'solo afirmaciones rusas, no verificables']],
  atacms: [['nov-24', 19, 15, '79% (reclamado)', 'tass_atacms', 'MoD ruso, sin verificar']],
  neptune: [], lyutyi: [],
  flamingo: [['hasta jun-26', 34, null, '5 impactos creíbles', 'kp_flamingo', 'no separa intercepción de falla']]
};
