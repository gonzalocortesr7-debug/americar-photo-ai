export default function Resumen() {
  return (
    <div className="space-y-8">
      <section className="rounded-xl bg-gradient-to-br from-brand-600/15 to-slate-900 border border-brand-500/40 p-5">
        <div className="flex items-start gap-3">
          <span className="shrink-0 mt-0.5 inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-500 text-slate-950 text-xs font-bold">10</span>
          <div>
            <h3 className="font-semibold text-brand-300">Alcance acotado</h3>
            <p className="text-slate-200 text-sm mt-1 leading-relaxed">
              Se mantiene el mismo backoffice actual de Americar (<code className="text-brand-300">backoffice.americar.com</code>) y el
              mismo micro-frontend <code className="text-brand-300">portal_mf_inspection</code>. El inspector sigue haciendo la
              inspección desde su teléfono tal cual como hoy. La propuesta se integra <strong>exclusivamente</strong> en el{" "}
              <span className="text-brand-300">paso 10 “Fotografías del Vehículo”</span>, sin agregar pantallas ni apps nuevas.
              Ver tab <em>Stack Actual</em> para el detalle de libs y arquitectura que se respetan.
            </p>
            <p className="text-slate-300 text-sm mt-2 leading-relaxed">
              En cada slot, la cámara del teléfono muestra una <strong>silueta de encuadre</strong> del ángulo esperado —
              estilo verificación facial pero vehicular. Al <em>Guardar</em> la inspección, el pipeline IA
              (<strong className="text-brand-300">Nano Banana</strong> + segmentación) corre <strong>solo sobre la foto de
              publicación</strong> (★ Frente Derecho, ángulo fijo para toda la flota) y devuelve al portal la versión
              procesada lista para publicar. Las otras 13 fotos quedan intactas como respaldo.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-2">El problema</h2>
        <p className="text-slate-300 leading-relaxed">
          Las fotos que el inspector sube en el paso 10 llegan con suciedad de taller,
          fondos inconsistentes (playas, calles, galpones) y patentes visibles. Esto
          resta percepción de calidad, expone datos del vendedor anterior y obliga a
          ediciones manuales caras y lentas antes de publicar el usado.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-2">La solución</h2>
        <p className="text-slate-300 leading-relaxed">
          Al guardar la inspección, solo la <strong>foto de publicación</strong> (Frente Derecho, el mismo
          ángulo para toda la flota) atraviesa una operación con IA generativa que aplica tres transformaciones:
        </p>
        <ul className="mt-4 grid md:grid-cols-3 gap-3">
          <Feature title="Iluminación corregida" desc="Exposición pareja; se neutralizan sombras duras y zonas quemadas." />
          <Feature title="Suciedad removida" desc="Polvo, barro y manchas de agua de carrocería y vidrios." />
          <Feature title="Reflejos neutralizados" desc="Se atenúan brillos y reflejos del ambiente (luces, personas, cartelería)." />
          <Feature title="Patente tapada" desc="Cuadro con logo de Americar sobre la patente detectada." />
          <Feature title="Fondo de cabina virtual" desc="Estudio gris claro con piso reflectante reemplaza el fondo original." />
          <Feature title="Mismo auto, mismo lado" desc="No se rejuvenece ni se espeja: marca, modelo, ángulo, rayones y desgaste se preservan." />
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-2">KPIs esperados</h2>
        <div className="grid md:grid-cols-4 gap-4 mt-4">
          <Kpi value="30-60s" label="por inspección (1 foto)" />
          <Kpi value="~$0.07" label="costo por inspección (medium)" />
          <Kpi value="0 hrs" label="retoque manual" />
          <Kpi value="100%" label="patentes cubiertas" />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-2">Beneficios</h2>
        <ul className="text-slate-300 space-y-2 list-disc pl-6">
          <li>Uniformidad de marca en todas las publicaciones del Portal Americar.</li>
          <li>Compliance: no exposición de datos identificatorios del vehículo.</li>
          <li>Escalable a cientos de inspecciones por día sin contratar editores.</li>
          <li>Cero fricción para el inspector: mismo flujo que hoy; la IA corre al guardar.</li>
        </ul>
      </section>
    </div>
  );
}

function Feature({ title, desc }) {
  return (
    <div className="rounded-xl bg-slate-900 border border-slate-800 p-4">
      <div className="font-semibold text-brand-300">{title}</div>
      <div className="text-sm text-slate-400 mt-1">{desc}</div>
    </div>
  );
}

function Kpi({ value, label }) {
  return (
    <div className="rounded-xl bg-slate-900 border border-slate-800 p-4">
      <div className="text-2xl font-bold text-brand-300">{value}</div>
      <div className="text-xs text-slate-400 mt-1 uppercase tracking-wide">{label}</div>
    </div>
  );
}
