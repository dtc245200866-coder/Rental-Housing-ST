import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { assetUrl, formatArea, formatMoney } from '../../utils/format';
import type { PublicListing } from '../../types';
import EmptyState from '../../components/EmptyState';
import Loading from '../../components/Loading';

export default function PublicSearch() {
  const [listings, setListings] = useState<PublicListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    district: '',
    minRent: '',
    maxRent: '',
    minArea: '',
    maxArea: '',
    sort: 'newest',
  });

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.district) params.set('district', filters.district);
    if (filters.minRent) params.set('minRent', filters.minRent);
    if (filters.maxRent) params.set('maxRent', filters.maxRent);
    if (filters.minArea) params.set('minArea', filters.minArea);
    if (filters.maxArea) params.set('maxArea', filters.maxArea);
    params.set('sort', filters.sort);

    api
      .get<PublicListing[]>('/public/listings', { params })
      .then(({ data }) => setListings(data))
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }, [filters]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🏠</span>
            <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
              Quản Lý Phòng Trọ
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/login" className="btn-secondary">
              Đăng nhập
            </Link>
            <Link to="/register" className="btn-primary">
              Đăng ký
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Tìm phòng trọ, căn hộ cho thuê
        </h1>

        <div className="card mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <input
            className="input"
            placeholder="Quận / huyện"
            value={filters.district}
            onChange={(e) => setFilters((f) => ({ ...f, district: e.target.value }))}
          />
          <input
            className="input"
            type="number"
            placeholder="Giá từ (đ)"
            value={filters.minRent}
            onChange={(e) => setFilters((f) => ({ ...f, minRent: e.target.value }))}
          />
          <input
            className="input"
            type="number"
            placeholder="Giá đến (đ)"
            value={filters.maxRent}
            onChange={(e) => setFilters((f) => ({ ...f, maxRent: e.target.value }))}
          />
          <input
            className="input"
            type="number"
            placeholder="DT từ (m²)"
            value={filters.minArea}
            onChange={(e) => setFilters((f) => ({ ...f, minArea: e.target.value }))}
          />
          <input
            className="input"
            type="number"
            placeholder="DT đến (m²)"
            value={filters.maxArea}
            onChange={(e) => setFilters((f) => ({ ...f, maxArea: e.target.value }))}
          />
          <select
            className="input"
            value={filters.sort}
            onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}
          >
            <option value="newest">Mới đăng nhất</option>
            <option value="price_asc">Giá tăng dần</option>
            <option value="price_desc">Giá giảm dần</option>
          </select>
        </div>

        {loading ? (
          <Loading />
        ) : listings.length === 0 ? (
          <EmptyState message="Không có tin đăng phù hợp. Thử nới rộng khoảng giá hoặc khu vực." />
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => (
              <Link
                key={l.id}
                to={`/listings/${l.id}`}
                className="card block overflow-hidden !p-0 transition-shadow hover:shadow-md"
              >
                <div className="aspect-video w-full bg-gray-200">
                  {l.coverImage ? (
                    <img
                      src={assetUrl(l.coverImage)}
                      alt={l.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl">🏠</div>
                  )}
                </div>
                <div className="p-4">
                  <p className="font-semibold text-primary-600 dark:text-primary-400">
                    {formatMoney(l.rent)}
                    <span className="text-xs font-normal text-gray-400">/tháng</span>
                  </p>
                  <h2 className="mt-1 line-clamp-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {l.title}
                  </h2>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {l.address} · {formatArea(l.area)} · tối đa {l.maxPeople} người
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
