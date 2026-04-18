export {};

const BASE_URL = "http://localhost:3000";
const WORKPLACE_ACTIVE_STATUS = 0;

interface Shift {
  workplaceId: number | null;
  cancelledAt: string | null;
}

interface WorkplaceResult {
  name: string;
  shifts: number;
}

async function main() {
  try {
    // 1. Traer todos los turnos
    const shifts: Shift[] = [];
    let url: string | undefined = `${BASE_URL}/shifts?page=0`;

    while (url) {
      const res: Response = await fetch(url);
      if (!res.ok) throw new Error(`Error al traer turnos: HTTP ${res.status}`);
      const json: { data: Shift[]; links?: { next?: string } } = await res.json();
      shifts.push(...json.data);
      url = json.links?.next;
    }

    // 2. Contar turnos activos por workplace
    const counts: Record<number, number> = {};
    shifts
      .filter((s) => s.cancelledAt === null && s.workplaceId !== null)
      .forEach((s) => (counts[s.workplaceId!] = (counts[s.workplaceId!] || 0) + 1));

    // 3. Ordenar todos los workplaces de mayor a menor
    const sortedIds = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => Number(id));

    // 4. Buscar los top 3 activos
    const results: WorkplaceResult[] = [];
    for (const id of sortedIds) {
      if (results.length === 3) break;
      const res: Response = await fetch(`${BASE_URL}/workplaces/${id}`);
      if (!res.ok) throw new Error(`Error al traer workplace: HTTP ${res.status}`);
      const { data } = await res.json();
      if (data.status === WORKPLACE_ACTIVE_STATUS) {
        results.push({ name: data.name, shifts: counts[id] });
      }
    }

    console.log(JSON.stringify(results, null, 2));
  } catch (error) {
    console.error("Algo salió mal:", error);
  }
}

main();