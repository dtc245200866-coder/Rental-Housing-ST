import { useEffect, useState } from 'react';
import { api, extractMessage } from '../../api/client';
import type { Building, MeterProgress, MeterReadingRow } from '../../types';
import { METER_STATUS_LABELS } from '../../utils/constants';
import Badge from '../../components/Badge';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import Alert from '../../components/Alert';

export default function MeterReadings() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [buildingId, setBuildingId] = useState('');
  const [period, setPeriod] = useState(() => new Date().toISOString().slice(0, 7));
  const [rows, setRows] = useState<MeterReadingRow[]>([]);
  const [progress, setProgress] = useState<MeterProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<Building[]>('/buildings').then(({ data }) => {
      setBuildings(data);
      if (data.length > 0 && !buildingId) setBuildingId(String(data[0].id));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!buildingId || !period) return;
    setLoading(true);
    Promise.all([
      api.get<MeterReadingRow[]>('/meter-readings/list', { params: { buildingId, period } }),
      api.get<MeterProgress>('/meter-readings/progress', { params: { buildingId, period } }),
    ])
      .then(([r, p]) => {
        setRows(r.data);
        setProgress(p.data);
      })
      .finally(() => setLoading(false));
  }, [buildingId, period]);

  async function save(row: MeterReadingRow) {
    setSavingId(row.roomId);
    setError('');
    try {
      const { data } = await api.post('/meter-readings', {
        roomId: row.roomId,
        period,
        currentElectric: row.currentElectric ?? 0,
        currentWater: row.currentWater ?? 0,
      });
      if (data.warning) {
        alert('Cảnh báo: mức tiêu thụ chênh hơn 200% so với trung bình 3 kỳ gần nhất.');
      }
      const p = await api.get<MeterProgress>('/meter-readings/progress', { params: { buildingId, period } });
      setProgress(p.data);
    } catch (err) {
      setError(extractMessage(err, 'Lưu thất bại').message);
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Ghi chỉ số điện nước</h1>

      <div className="flex flex-wrap gap-2">
        <select className="input max-w-xs" value={buildingId} onChange={(e) => setBuildingId(e.target.value)}>
          {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <input className="input max-w-xs" type="month" value={period} onChange={(e) => setPeriod(e.target.value)} />
      </div>

      {progress && (
        <div className="card flex flex-wrap gap-6 text-sm">
          <div><span className="text-gray-400">Tổng phòng: </span><b>{progress.totalRooms}</b></div>
          <div><span className="text-gray-400">Đã chốt: </span><b className="text-emerald-600">{progress.done}</b></div>
          <div><span className="text-gray-400">Còn thiếu: </span><b className="text-amber-600">{progress.missing}</b></div>
          {progress.missingRooms.length > 0 && (
            <div className="w-full text-xs text-gray-500">Thiếu: {progress.missingRooms.join(', ')}</div>
          )}
        </div>
      )}

      {error && <Alert message={error} onClose={() => setError('')} />}

      <div className="card !p-0">
        {loading ? (
          <Loading />
        ) : rows.length === 0 ? (
          <EmptyState message="Không có phòng đang thuê trong kỳ này" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="table-th">Phòng</th>
                  <th className="table-th">Điện trước</th>
                  <th className="table-th">Điện hiện tại</th>
                  <th className="table-th">Nước trước</th>
                  <th className="table-th">Nước hiện tại</th>
                  <th className="table-th">Trạng thái</th>
                  <th className="table-th"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {rows.map((r) => (
                  <tr key={r.roomId}>
                    <td className="table-td font-medium text-gray-900 dark:text-gray-100">{r.roomCode} <span className="text-xs text-gray-400">T{r.floor}</span></td>
                    <td className="table-td">{r.prevElectric}</td>
                    <td className="table-td">
                      <input
                        className="input !w-28 !py-1.5 text-sm"
                        type="number"
                        min={r.prevElectric}
                        value={r.currentElectric ?? ''}
                        disabled={r.status === 'FINALIZED'}
                        onChange={(e) => setRows((list) => list.map((x) => x.roomId === r.roomId ? { ...x, currentElectric: e.target.value === '' ? null : Number(e.target.value) } : x))}
                      />
                    </td>
                    <td className="table-td">{r.prevWater}</td>
                    <td className="table-td">
                      <input
                        className="input !w-28 !py-1.5 text-sm"
                        type="number"
                        min={r.prevWater}
                        value={r.currentWater ?? ''}
                        disabled={r.status === 'FINALIZED'}
                        onChange={(e) => setRows((list) => list.map((x) => x.roomId === r.roomId ? { ...x, currentWater: e.target.value === '' ? null : Number(e.target.value) } : x))}
                      />
                    </td>
                    <td className="table-td"><Badge value={r.status} label={METER_STATUS_LABELS[r.status]} /></td>
                    <td className="table-td">
                      {r.status !== 'FINALIZED' && (
                        <button
                          className="btn-primary !py-1.5 text-xs"
                          disabled={savingId === r.roomId || r.currentElectric === null || r.currentWater === null}
                          onClick={() => save(r)}
                        >
                          {savingId === r.roomId ? 'Đang lưu…' : 'Lưu'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
