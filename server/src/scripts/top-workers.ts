export {};

const BASE_URL = "http://localhost:3000";
const WORKER_ACTIVE_STATUS = 0;

interface Shift {
  workerId: number | null;
  cancelledAt: string | null;
}

interface WorkerResult {
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

    // 2. Contar turnos activos por worker
    const counts: Record<number, number> = {};
    shifts
      .filter((s) => s.cancelledAt === null && s.workerId !== null)
      .forEach((s) => (counts[s.workerId!] = (counts[s.workerId!] || 0) + 1));

    // 3. Ordenar todos los workers de mayor a menor
    const sortedIds = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => Number(id));

    // 4. Buscar los top 3 activos
    const results: WorkerResult[] = [];
    for (const id of sortedIds) {
      if (results.length === 3) break;
      const res: Response = await fetch(`${BASE_URL}/workers/${id}`);
      if (!res.ok) throw new Error(`Error al traer worker: HTTP ${res.status}`);
      const { data } = await res.json();
      if (data.status === WORKER_ACTIVE_STATUS) {
        results.push({ name: data.name, shifts: counts[id] });
      }
    }

    console.log(JSON.stringify(results, null, 2));
  } catch (error) {
    process.stderr.write(`Error: ${error}\n`);
  }
}

main();
