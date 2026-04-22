export default function Resumen() {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-semibold mb-2">El problema</h2>
        <p className="text-slate-300 leading-relaxed">
          Las fotos de los vehículos usados que se publican en los portales
          llegan con suciedad, fondos inconsistentes (playas de estacionamiento,
          calles, galpones) y patentes visibles. Esto resta percepción de calidad,
          expone datos del vendedor anterior y obliga a ediciones manuales
          caras y lentas.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-2">La solución</h2>
        <p className="text-slate-300 leading-relaxed">
          Una aplicación web que toma la foto original y en una sola operación
          aplica tres transformaciones con IA generativa:
        </p>
        <ul className="mt-4 grid md:grid-cols-3 gap-3">
          <Feature title="Detallado" desc="Limpieza virtual: elimina polvo, barro, reflejos sucios y manchas de agua." />
          <Feature title="Estudio virtual" desc="Reemplaza el fondo por un showroom con piso reflectante e iluminación pro." />
          <Feature title="Patente cubierta" desc="Tapa la patente con un cuadro que contiene el logo de Americar." />
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-2">KPIs esperados</h2>
        <div className="grid md:grid-cols-4 gap-4 mt-4">
          <Kpi value="30-60s" label="tiempo por foto" />
          <Kpi value="~$0.07" label="costo por foto (medium)" />
          <Kpi value="0 hrs" label="retoque manual" />
          <Kpi value="100%" label="patentes cubiertas" />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-2">Beneficios</h2>
        <ul className="text-slate-300 space-y-2 list-disc pl-6">
          <li>Uniformidad de marca en todas las publicaciones.</li>
          <li>Compliance: no exposición de datos identificatorios del vehículo.</li>
          <li>Escalable a cientos de fotos por día sin contratar editores.</li>
          <li>Sin instalación: corre en el navegador del equipo de publicaciones.</li>
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
