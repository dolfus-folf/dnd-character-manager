let DATA=null; let PERSONAJE=null;
const STATS={fuerza:'FUE',destreza:'DES',constitucion:'CON',inteligencia:'INT',sabiduria:'SAB',carisma:'CAR'};
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function signed(n){return Number(n)>=0?`+${n}`:`${n}`}
function mod(n){return Math.floor((Number(n)-10)/2)}
function humanize(id){return String(id||'').replace(/_/g,' ').replace(/-/g,' ')}
function titleCase(s){return String(s||'').replace(/\b\w/g,c=>c.toUpperCase())}
function nameOf(list,id){return (list||[]).find(x=>x.id===id)?.nombre||id||'—'}
async function api(url,body){
  let resultado;
  if(url==='/api/personajes') resultado=DNDCore.crearPersonajeCompleto(body);
  else if(url==='/api/personajes/estado'){
    const p=body.personaje;
    switch(body.accion){
      case 'dano': resultado=DNDCore.recibirDano(p,body.cantidad); break;
      case 'curar': resultado=DNDCore.curarPersonaje(p,body.cantidad); break;
      case 'restaurar_pg': resultado=DNDCore.restaurarPuntosGolpe(p); break;
      case 'gastar_recurso': resultado=DNDCore.gastarRecurso(p,body.recurso,body.cantidad); break;
      case 'recuperar_recurso': resultado=DNDCore.recuperarRecurso(p,body.recurso,body.cantidad??null); break;
      case 'condicion': resultado=body.agregar?DNDCore.aplicarCondicion(p,body.condicion):DNDCore.quitarCondicion(p,body.condicion); break;
      default: resultado={exitoso:false,errores:['accion_no_soportada']};
    }
    if(resultado.exitoso) DNDCore.recalcularPersonaje(p);
    resultado={...resultado,personaje:p};
  } else if(url==='/api/personajes/subir-nivel'){
    resultado=DNDCore.subirNivelPersonaje(body.personaje,body.opciones||{});
    if(resultado.exitoso) DNDCore.recalcularPersonaje(body.personaje);
    resultado={...resultado,personaje:body.personaje};
  } else if(url==='/api/equipar' || url==='/api/desequipar'){
    resultado=url==='/api/equipar'?DNDCore.equiparEquipo(body.personaje,body.id_instancia,body.ranura||null):DNDCore.desequiparEquipo(body.personaje,body.id_instancia);
    if(resultado.exitoso) DNDCore.recalcularPersonaje(body.personaje);
    resultado={...resultado,personaje:body.personaje};
  } else throw new Error('Operacion no soportada');
  if(!resultado || resultado.exitoso===false) throw new Error((resultado?.errores||[resultado?.motivo||'Error']).join(', '));
  return resultado;
}
function fill(select,items,placeholder){select.innerHTML=`<option value="">${placeholder}</option>`+(items||[]).map(x=>`<option value="${escapeHtml(x.id)}">${escapeHtml(x.nombre)}</option>`).join('')}
function selectedBonusMap(){const out={};$$('[data-background-bonus]').forEach(x=>{const n=Number(x.value);if(n)out[x.dataset.backgroundBonus]=n});return out}
function renderAdjustedPreview(){
  const base=Object.fromEntries(Object.keys(STATS).map(k=>[k,Number($(`[name="${k}"]`)?.value||10)]));
  const bonus=selectedBonusMap();
  const values={...base}; for(const [k,v] of Object.entries(bonus)) values[k]=(values[k]||10)+v;
  const total=Object.values(bonus).reduce((a,b)=>a+b,0);
  const target=$('#adjustedStatsPreview'); if(!target)return;
  target.innerHTML=Object.entries(STATS).map(([k,n])=>`<div class="preview-stat"><span>${n}</span><b>${values[k]}</b><small>${signed(mod(values[k]))}${bonus[k]?` · +${bonus[k]} origen`:''}</small></div>`).join('');
  const note=$('#bonusValidation');
  const t=DATA?.trasfondos?.find(x=>x.id===$('#trasfondo').value); const rule=t?.detalle?.puntuaciones_caracteristica?.regla_aumento; const allowed=t?.detalle?.puntuaciones_caracteristica?.opciones||[];
  if(note && rule){
    const patterns=(rule.opciones_distribucion||[]).map(a=>[...a].sort((x,y)=>y-x).join(','));
    const current=Object.values(bonus).filter(v=>v>0).sort((a,b)=>b-a).join(',');
    const keysOk=Object.keys(bonus).every(k=>allowed.includes(k));
    const valid=patterns.includes(current)&&keysOk&&Object.values(values).every(v=>v<=Number(rule.maximo??20));
    note.className='validation '+(valid?'ok':'warn');
    note.textContent=valid?`Distribución válida (${total} puntos).`:`Distribuye ${patterns.join(' o ')} puntos entre: ${allowed.map(humanize).join(', ')}.`;
  } else if(note) {note.className='validation';note.textContent='Selecciona un trasfondo para ver sus aumentos.'}
}
function updateMods(){Object.keys(STATS).forEach(k=>{const el=$(`#m-${k}`);if(el){const v=Number($(`[name="${k}"]`).value||10);el.textContent=signed(mod(v))}});renderAdjustedPreview()}
function updateSubclasses(){
  const clase=$('#clase').value; const arr=DATA.subclases.filter(x=>x.clase===clase);
  const nivel=Number($('#nivel').value||1); const available=nivel>=3;
  $('#subclase').disabled=!available; $('#subclase').innerHTML='<option value="">'+(available?'Selecciona subclase':'Se elige a nivel 3')+'</option>'+(available?arr.map(x=>`<option value="${escapeHtml(x.id)}">${escapeHtml(x.nombre)}</option>`).join(''):'');
  renderClassInfo(); renderClassSkills();
}
function renderClassInfo(){
 const id=$('#clase').value; const d=DATA.detalles?.clases?.[id]; const box=$('#classInfo');
 if(!d){box.classList.add('hidden');box.innerHTML='';return}
 const main=Array.isArray(d.atributos_basicos?.caracteristica_principal)?d.atributos_basicos.caracteristica_principal.map(humanize).join(' / '):humanize(d.atributos_basicos?.caracteristica_principal);
 const skills=d.atributos_basicos?.habilidades?.opciones||[];
 box.classList.remove('hidden');box.innerHTML=`<details open><summary>Información de ${escapeHtml(d.nombre)}</summary><p>${escapeHtml(d.descripcion||'')}</p><div class="info-grid"><span><b>Característica principal:</b> ${escapeHtml(main)}</span><span><b>Dado de golpe:</b> ${escapeHtml(d.atributos_basicos?.dado_puntos_golpe||'—')}</span><span><b>Salvaciones:</b> ${escapeHtml((d.atributos_basicos?.salvaciones||[]).map(humanize).join(', ')||'—')}</span><span><b>Habilidades:</b> ${escapeHtml(skills.map(humanize).join(', ')||'—')}</span></div></details>`;
}
function renderClassSkills(){
 const id=$('#clase').value; const d=DATA.detalles?.clases?.[id]; const box=$('#classSkills');
 const def=d?.atributos_basicos?.habilidades; if(!box)return;
 if(!def?.opciones?.length){box.innerHTML='<span class="muted">Esta clase no presenta una selección de habilidades aquí.</span>';return}
 const cantidad=Number(def.cantidad||1); const existing=Array.from({length:cantidad},(_,i)=>$(`[data-class-skill="${i}"]`)?.value||'');
 box.innerHTML=Array.from({length:cantidad},(_,i)=>`<label>Habilidad ${i+1}<select data-class-skill="${i}"><option value="">Selecciona…</option>${def.opciones.map(o=>`<option value="${escapeHtml(o)}" ${existing[i]===o?'selected':''}>${escapeHtml(humanize(o))}</option>`).join('')}</select></label>`).join('');
}
function detalleEspecie(id){return DATA.detalles?.especies?.[id]||null}
function renderSpeciesSelections(){
 const id=$('#especie').value; const d=detalleEspecie(id); const box=$('#speciesSelections');
 if(!d){box.classList.add('hidden');box.innerHTML='';return}
 const nivel=Number($('#nivel').value||1); const sels=[];
 for(const [rid,r] of Object.entries(d.rasgos||{})){
   if(!r.seleccion)continue; if(r.nivel && Number(r.nivel)>nivel)continue;
   const opts=r.seleccion.opciones||[]; let source=d.linajes?.[opts[0]]?'linajes':d.legados?.[opts[0]]?'legados':null;
   const options=opts.map(o=>{let detail=r.opciones?.[o]||d.linajes?.[o]||d.legados?.[o];if(!detail&&d.tabla_ancestros?.[o])detail={nombre:o,tipo_dano:d.tabla_ancestros[o]};return {id:o,nombre:detail?.nombre||humanize(o),detalle:detail}});
   sels.push({id:rid,nombre:r.nombre||rid,descripcion:r.descripcion||'',tipo:r.seleccion.tipo_seleccion,opciones});
 }
 if(!sels.length){box.classList.add('hidden');box.innerHTML='';return}
 box.classList.remove('hidden');box.innerHTML=`<h3>Opciones de ${escapeHtml(d.nombre)}</h3><p class="muted">Estas elecciones se guardarán como parte del personaje.</p>${sels.map(s=>`<div class="selection-block"><details open><summary>${escapeHtml(s.nombre)}</summary><p>${escapeHtml(s.descripcion)}</p><select data-species-selection="${escapeHtml(s.id)}"><option value="">Selecciona…</option>${s.opciones.map(o=>`<option value="${escapeHtml(o.id)}">${escapeHtml(o.nombre)}</option>`).join('')}</select>${s.opciones.map(o=>o.detalle?.descripcion?`<div class="option-description"><b>${escapeHtml(o.nombre)}:</b> ${escapeHtml(o.detalle.descripcion)}</div>`:'').join('')}</details></div>`).join('')}`;
}
function renderBackground(){
 const id=$('#trasfondo').value; const d=DATA.detalles?.trasfondos?.[id]; const box=$('#backgroundInfo');
 if(!d){box.classList.add('hidden');box.innerHTML='';$('#backgroundBonuses').classList.add('hidden');$('#backgroundBonuses').innerHTML='';renderAdjustedPreview();return}
 box.classList.remove('hidden');box.innerHTML=`<details open><summary>Información de ${escapeHtml(d.nombre)}</summary><p>${escapeHtml(d.descripcion||'')}</p><div class="info-grid"><span><b>Dote:</b> ${escapeHtml(nameOf(DATA.dotes,d.dote))}</span><span><b>Habilidades:</b> ${escapeHtml((d.competencias?.habilidades||[]).map(humanize).join(', ')||'—')}</span></div></details>`;
 const b=d.puntuaciones_caracteristica; const bb=$('#backgroundBonuses');
 if(!b){bb.classList.add('hidden');bb.innerHTML='';return}
 bb.classList.remove('hidden'); const rules=b.regla_aumento?.opciones_distribucion||[];
 bb.innerHTML=`<h3>Aumentos de característica</h3><p class="muted">Opciones: ${rules.map(r=>r.join(' + ')).join(' o ')}. Solo puedes aplicarlos a ${b.opciones.map(humanize).join(', ')}.</p><div class="bonus-grid">${b.opciones.map(stat=>`<label>${escapeHtml(STATS[stat]||humanize(stat))}<select data-background-bonus="${escapeHtml(stat)}"><option value="0">+0</option><option value="1">+1</option><option value="2">+2</option></select></label>`).join('')}</div><div class="validation-hint">Los aumentos se reflejan en la vista previa de características.</div>`;
 renderAdjustedPreview();
}
function renderEquipmentContent(contents){return (contents||[]).map(x=>{if(x.moneda)return `<span class="choice-item coin">${x.cantidad} ${escapeHtml(x.id)}</span>`;if(x.seleccion)return `<span class="choice-item selection">${escapeHtml(x.texto)}</span>`;return `<span class="choice-item">${x.cantidad>1?`${x.cantidad} × `:''}${escapeHtml(x.texto||x.id)}</span>`}).join('')||'<span class="muted">Sin detalle estructurado</span>'}
function renderEquipmentChoices(){
 const cls=DATA.clases.find(x=>x.id===$('#clase').value); const t=DATA.trasfondos.find(x=>x.id===$('#trasfondo').value);
 $('#classEquipmentPreview').innerHTML=cls?.equipo?equipmentBlock(`Equipo inicial · ${cls.nombre}`,cls.equipo):'';
 $('#backgroundEquipmentPreview').innerHTML=t?.equipo?equipmentBlock(`Equipo inicial · ${t.nombre}`,t.equipo):'';
 setEquipmentSelect($('#equipoClase'),cls?.equipo);setEquipmentSelect($('#equipoTrasfondo'),t?.equipo);
}
function equipmentBlock(title,def){if(!def)return '';if(def.tipo==='texto')return `<details class="choice-card"><summary>${escapeHtml(title)}</summary><p>${escapeHtml(def.texto)}</p></details>`;return `<details class="choice-card" open><summary>${escapeHtml(title)} · compara antes de elegir</summary><div class="choice-options">${def.opciones.map(o=>`<div class="choice-option"><b>Opción ${escapeHtml(o.id.toUpperCase())}</b><div class="tag-line">${renderEquipmentContent(o.contenido)}</div></div>`).join('')}</div></details>`}
function setEquipmentSelect(el,def){if(!el)return;const opts=def?.tipo==='seleccion'?def.opciones||[]:[];el.disabled=!opts.length;el.innerHTML='<option value="">Selecciona…</option>'+opts.map(o=>`<option value="${escapeHtml(o.id)}">Opción ${escapeHtml(o.id.toUpperCase())}</option>`).join('')}
function updateOriginPanels(){renderSpeciesSelections();renderBackground();renderEquipmentChoices();renderClassInfo();renderClassSkills();}
function buildBody(){
 const f=new FormData($('#form')); const habilidades=$$('[data-class-skill]').map(x=>x.value).filter(Boolean); const selEspecie={};$$('[data-species-selection]').forEach(x=>{if(x.value)selEspecie[x.dataset.speciesSelection]=x.value});
 const aumentos=selectedBonusMap(); const herramienta=$('#herramientaTrasfondo').value.trim();
 return {id:`personaje_${Date.now()}`,nombre:f.get('nombre'),jugador:f.get('jugador'),especie:f.get('especie')||null,trasfondo:f.get('trasfondo')||null,clase:f.get('clase')||null,subclase:f.get('subclase')||null,nivel:Number(f.get('nivel')),caracteristicas:Object.fromEntries(Object.keys(STATS).map(k=>[k,Number(f.get(k))])),opciones_habilidades_clase:habilidades,selecciones_especie:selEspecie,aumentos_caracteristica:aumentos,dote_origen:null,selecciones_trasfondo:herramienta?{herramienta,tipo_juego:herramienta}:{},equipo_clase_opcion:f.get('equipo_clase_opcion')||null,equipo_trasfondo_opcion:f.get('equipo_trasfondo_opcion')||null};
}
function findEquipment(id){for(const group of Object.values(DATA.equipo||{})){const x=group.find?.(v=>v.id===id);if(x)return x}return null}
function skillDetail(id){return DATA.detalles?.habilidades?.[id]||DATA.detalles?.habilidades?.[titleCase(humanize(id))]||null}
function accordion(title,body,open=false){return `<details class="accordion" ${open?'open':''}><summary>${escapeHtml(title)}</summary><div class="accordion-body">${body}</div></details>`}
function featureDetail(id,origin){let d;if(origin==='clase')d=DATA.detalles?.clases?.[PERSONAJE.base.clase]?.rasgos?.[id];else if(origin==='subclase')d=DATA.detalles?.subclases?.[PERSONAJE.base.subclase]?.rasgos?.[id];else d=DATA.detalles?.especies?.[PERSONAJE.base.especie]?.rasgos?.[id];return d||{id,nombre:humanize(id),descripcion:'La descripción detallada todavía no está disponible en el catálogo estructurado.'}}
function renderFeatureList(ids,origin){return (ids||[]).map(id=>{const d=featureDetail(id,origin);return accordion(`${d.nombre}${d.nivel?` · nivel ${d.nivel}`:''}`,`<p>${escapeHtml(d.descripcion||'')}</p>`,false)}).join('')||'<span class="muted">Ninguno registrado.</span>'}
function renderSkillList(skills){return (skills||[]).map(id=>{const d=skillDetail(id);const stat=d?.caracteristica_base;const bonus=PERSONAJE.calculado?.modificadores_caracteristica?.[stat]??0;return accordion(`${d?.nombre||humanize(id)} · ${stat?STATS[stat]:''}`,`<p>${d?.descripcion?escapeHtml(d.descripcion):'Habilidad de D&D.'}</p><p class="muted">Modificador base: ${signed(bonus)} · competencia: sí</p>`)}).join('')||'<span class="muted">Ninguna registrada.</span>'}
function renderCharacter(p){
 const b=p.base||{},c=p.calculado||{},s=b.caracteristicas||{},inv=p.estado?.equipo?.inventario||[];
 const stats=Object.entries(STATS).map(([k,n])=>`<div class="stat-card"><small>${n}</small><b>${s[k]??10}</b><span>${signed(c.modificadores_caracteristica?.[k]??mod(s[k]??10))}</span></div>`).join('');
 const items=inv.map(i=>{const obj=findEquipment(i.objeto_id);return accordion(`${obj?.nombre||i.objeto_id} · x${i.cantidad}`,`<p>${escapeHtml(obj?.descripcion||'Sin descripción detallada.')}</p><div class="item-actions">${i.equipado?`<button class="tiny-btn" data-item="${i.id_instancia}" data-action="unequip">Desequipar</button>`:`<button class="tiny-btn" data-item="${i.id_instancia}" data-action="equip">Equipar</button>`}</div>`,false)}).join('')||'<div class="empty">Inventario vacío</div>';
 const resources=Object.entries(p.recursos||{}).filter(([k])=>k!=='espacios_conjuro').map(([k,v])=>`<div class="resource-row"><span>${escapeHtml(humanize(k))}</span><b>${v.actual}/${v.maximo}</b><button class="tiny-btn" data-resource="${escapeHtml(k)}" data-action="spend">−</button><button class="tiny-btn" data-resource="${escapeHtml(k)}" data-action="restore">+</button></div>`).join('')||'<span class="muted">Sin recursos numerados</span>';
 const slots=Object.entries(p.recursos?.espacios_conjuro||{}).map(([k,v])=>`<div class="resource-row"><span>Espacio nivel ${k}</span><b>${v.actual}/${v.maximo}</b><button class="tiny-btn" data-slot="${k}" data-action="slot">−</button></div>`).join('')||'<span class="muted">Sin espacios</span>';
 const skills=b.competencias?.habilidades||[]; const increases=Object.entries(b.aumentos_caracteristica||{}).map(([k,v])=>`<span class="tag">${STATS[k]||humanize(k)} +${v}</span>`).join('')||'<span class="muted">Ninguno</span>';
 const lineage=Object.entries(b.datos_especie_seleccionada||{}).map(([k,v])=>accordion(v.nombre||v.id||humanize(k),`<p>${escapeHtml(v.descripcion||'Elección de origen registrada.')}</p>`)).join('')||'<span class="muted">Sin elección especial.</span>';
 const pending=(p.elecciones||[]).filter(x=>x.estado==='pendiente'||x.estado==='manual');
 const classD=DATA.detalles?.clases?.[b.clase]; const spellIds=b.conjuros||[];
 $('#sheet').innerHTML=`<div class="sheet-head"><div><h1 class="sheet-name">${escapeHtml(p.identidad?.nombre||'Sin nombre')}</h1><div class="meta">${escapeHtml(nameOf(DATA.especies,b.especie))} · ${escapeHtml(nameOf(DATA.clases,b.clase))}${b.subclase?' · '+escapeHtml(nameOf(DATA.subclases,b.subclase)):''} · Nivel ${b.nivel}</div></div><div class="badges"><span class="badge">PB ${signed(c.bonificador_competencia||0)}</span><span class="badge">Vel. ${c.velocidad??b.datos_origen?.velocidad??'—'}</span></div></div>
 <div class="sheet-tabs">${[['resumen','Resumen'],['estadisticas','Estadísticas'],['equipo','Equipo'],['conjuros','Conjuros'],['rasgos','Rasgos']].map((x,i)=>`<button class="sheet-tab ${i===0?'active':''}" data-tab="${x[0]}">${x[1]}</button>`).join('')}</div>
 <section class="sheet-panel active" data-panel="resumen"><div class="hero-grid"><div class="metric"><div class="label">Puntos de golpe</div><div class="value">${p.estado?.puntos_golpe_actuales??'—'} / ${p.estado?.puntos_golpe_maximos??c.puntos_golpe_base??'—'}</div><div class="hp-controls"><input id="hpAmount" type="number" min="1" placeholder="Cantidad"><button class="tiny-btn" data-action="damage">Daño</button><button class="tiny-btn" data-action="heal">Curar</button><button class="tiny-btn" data-action="fullheal">Máx.</button></div></div><div class="metric"><div class="label">Clase de armadura</div><div class="value">${c.clase_armadura??'—'}</div></div><div class="metric"><div class="label">Peso</div><div class="value">${Number(c.peso_inventario_kg??0).toFixed(1)} kg</div></div><div class="metric"><div class="label">Aumentos</div><div class="value tag-line">${increases}</div></div></div><div class="stats-sheet">${stats}</div><div class="columns"><div class="card"><h3>Habilidades</h3>${renderSkillList(skills)}</div><div class="card"><h3>Recursos</h3>${resources}</div><div class="card"><h3>Espacios de conjuro</h3>${slots}</div></div></section>
 <section class="sheet-panel" data-panel="estadisticas"><div class="stats-sheet large">${stats}</div><div class="columns"><div class="card"><h3>Origen y reglas aplicadas</h3>${accordion('Característica principal de clase',`<p>${escapeHtml(Array.isArray(classD?.atributos_basicos?.caracteristica_principal)?classD.atributos_basicos.caracteristica_principal.map(humanize).join(' / '):humanize(classD?.atributos_basicos?.caracteristica_principal))}</p>`)}${accordion('Aumentos del trasfondo',`<div class="tag-line">${increases}</div>`)}${accordion('Velocidad y tamaño',`<p>Velocidad: ${escapeHtml(String(b.datos_origen?.velocidad??'—'))} · Tamaño: ${escapeHtml(String(b.datos_origen?.tamano??'—'))}</p>`)}</div><div class="card"><h3>Competencias</h3>${renderSkillList(skills)}${accordion('Salvaciones',`<p>${escapeHtml((b.competencias?.salvaciones||[]).map(humanize).join(', ')||'Ninguna')}</p>`)}</div></div></section>
 <section class="sheet-panel" data-panel="equipo"><div class="sheet-block"><h3>Inventario · ${inv.length} entradas</h3>${items}</div><div class="card"><h3>Equipamiento equipado</h3>${Object.entries(p.estado?.equipo?.equipamiento||{}).map(([slot,id])=>`<div class="detail-row"><span>${escapeHtml(humanize(slot))}</span><b>${escapeHtml(id||'—')}</b></div>`).join('')||'<span class="muted">Nada equipado</span>'}</div></section>
 <section class="sheet-panel" data-panel="conjuros"><div class="card"><h3>Conjuros</h3>${spellIds.map(id=>{const sp=DATA.conjuros.find(x=>x.id===id);return accordion(sp?.nombre||id,`<p>${escapeHtml(sp?.descripcion||'Descripción del conjuro no disponible en el resumen.')}</p><p class="muted">Nivel ${sp?.nivel??'—'} · ${(sp?.clases||[]).map(humanize).join(', ')}</p>`)}).join('')||'<span class="muted">No hay conjuros seleccionados.</span>'}</div></section>
 <section class="sheet-panel" data-panel="rasgos"><div class="columns"><div class="card"><h3>Rasgos de clase</h3>${renderFeatureList(b.rasgos_clase,'clase')}</div><div class="card"><h3>Rasgos de subclase</h3>${renderFeatureList(b.rasgos_subclase,'subclase')}</div><div class="card"><h3>Rasgos de especie</h3>${renderFeatureList(Object.keys(b.rasgos_especie||{}),'especie')}<h3>Elecciones de linaje / variante</h3>${lineage}</div></div></section>
 ${pending.length?`<div class="pending"><strong>Elecciones pendientes (${pending.length})</strong>${pending.map(x=>accordion(x.rasgo||x.tipo||'Selección',`<pre>${escapeHtml(JSON.stringify(x,null,2))}</pre>`)).join('')}</div>`:''}`;
 bindSheetActions();bindTabs();
}
function bindTabs(){document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x===b));document.querySelectorAll('[data-panel]').forEach(x=>x.classList.toggle('active',x.dataset.panel===b.dataset.tab))}))}
async function stateAction(body){try{const data=await api('/api/personajes/estado',{...body,personaje:PERSONAJE});PERSONAJE=data.personaje;renderCharacter(PERSONAJE)}catch(e){alert(e.message)}}
function bindSheetActions(){document.querySelectorAll('[data-action]').forEach(btn=>btn.addEventListener('click',async()=>{const action=btn.dataset.action;if(action==='damage'||action==='heal'){const n=Number($('#hpAmount').value);if(!n)return;await stateAction({accion:action==='damage'?'dano':'curar',cantidad:n})}else if(action==='fullheal'){await stateAction({accion:'restaurar_pg'})}else if(action==='spend'||action==='restore'){await stateAction({accion:action==='spend'?'gastar_recurso':'recuperar_recurso',recurso:btn.dataset.resource,cantidad:1})}else if(action==='slot'){await stateAction({accion:'gastar_recurso',recurso:`espacios_conjuro.${btn.dataset.slot}`,cantidad:1})}else if(action==='equip'||action==='unequip'){try{const url=action==='equip'?'/api/equipar':'/api/desequipar';const d=await api(url,{personaje:PERSONAJE,id_instancia:btn.dataset.item});PERSONAJE=d.personaje;renderCharacter(PERSONAJE)}catch(e){alert(e.message)}}}))}
async function loadOptions(){const r=await fetch('./opciones.json');if(!r.ok)throw new Error('No se pudieron cargar los datos locales');DATA=await r.json();fill($('#especie'),DATA.especies,'Selecciona especie');fill($('#trasfondo'),DATA.trasfondos,'Selecciona trasfondo');fill($('#clase'),DATA.clases,'Selecciona clase');updateSubclasses();updateOriginPanels();$('#status').textContent=`${DATA.clases.length} clases · ${DATA.subclases.length} subclases · ${DATA.conjuros.length} conjuros`}
Object.keys(STATS).forEach(k=>$(`[name="${k}"]`).addEventListener('input',updateMods));
$('#clase').addEventListener('change',()=>{updateSubclasses();updateOriginPanels()});$('#nivel').addEventListener('input',()=>{updateSubclasses();updateOriginPanels()});$('#especie').addEventListener('change',updateOriginPanels);$('#trasfondo').addEventListener('change',updateOriginPanels);document.addEventListener('change',e=>{if(e.target.matches('[data-background-bonus]'))renderAdjustedPreview()});
$('#form').addEventListener('submit',async e=>{e.preventDefault();const body=buildBody();$('#status').textContent='Construyendo personaje…';try{const data=await api('/api/personajes',body);PERSONAJE=data.personaje;localStorage.setItem('dnd_personaje_actual',JSON.stringify(PERSONAJE));$('#builderView').classList.add('hidden');$('#sheetView').classList.remove('hidden');$('#status').textContent='Personaje activo';renderCharacter(PERSONAJE)}catch(err){$('#status').textContent='Error';alert(err.message)}});
$('#backBtn').addEventListener('click',()=>{$('#sheetView').classList.add('hidden');$('#builderView').classList.remove('hidden');$('#status').textContent='Datos listos'});
$('#saveBtn').addEventListener('click',()=>{if(!PERSONAJE)return;localStorage.setItem('dnd_personaje_actual',JSON.stringify(PERSONAJE));$('#status').textContent='Guardado localmente ✓';setTimeout(()=>$('#status').textContent='Personaje activo',1400)});
$('#levelBtn').addEventListener('click',async()=>{if(!PERSONAJE)return;try{const d=await api('/api/personajes/subir-nivel',{personaje:PERSONAJE,opciones:{restaurar_recursos:true}});PERSONAJE=d.personaje||PERSONAJE;renderCharacter(PERSONAJE)}catch(e){alert(e.message)}});
loadOptions().then(()=>{ updateMods(); const saved=localStorage.getItem('dnd_personaje_actual'); if(saved){ try{PERSONAJE=JSON.parse(saved); $('#builderView').classList.add('hidden'); $('#sheetView').classList.remove('hidden'); renderCharacter(PERSONAJE); $('#status').textContent='Personaje recuperado del dispositivo'; }catch(e){} } if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{}); }).catch(e=>{$('#status').textContent='Error';alert(e.message)});
