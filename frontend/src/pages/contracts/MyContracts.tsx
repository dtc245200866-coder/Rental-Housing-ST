import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import type { MyContract } from '../../types';
import { CONTRACT_STATUS_LABELS } from '../../utils/constants';
import { formatDate, formatMoney } from '../../utils/format';
import Badge from '../../components/Badge';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';

export default function MyContracts() {
  const [contracts, setContracts] = useState<MyContract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<MyContract[]>('/my/contracts').then(({ data }) => setContracts(data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Hợp đồng của tôi</h1>
      <div className="card !p-0">
        {loading ? (
          <Loading />
        ) : contracts.length === 0 ? (
          <EmptyState message="Bạn chưa có hợp đồng thuê nào" />
        ) : (
          <div className="space-y-4 p-4">
            {contracts.map((c) => (
              <div key={c.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{c.code}</span>
                  <Badge value={c.status} label={CONTRACT_STATUS_LABELS[c.status]} />
                </div>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  Phòng {c.roomCode} — {c.buildingName}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{c.address}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-400">Giá thuê: </span>{formatMoney(c.rent)}</div>
                  <div><span className="text-gray-400">Tiền cọc: </span>{formatMoney(c.deposit)}</div>
                  <div><span className="text-gray-400">Bắt đầu: </span>{formatDate(c.startDate)}</div>
                  <div><span className="text-gray-400">Kết thúc: </span>{formatDate(c.endDate)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
