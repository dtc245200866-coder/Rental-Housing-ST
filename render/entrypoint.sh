#!/bin/sh
set -e

# Render cấp cổng lắng nghe qua biến PORT (mặc định 10000).
PORT="${PORT:-10000}"

# Render trả connection string dạng postgres:// (hoặc postgresql://),
# còn PostgreSQL JDBC driver cần jdbc:postgresql://. Chuẩn hoá lại nếu cần.
if [ -n "$SPRING_DATASOURCE_URL" ]; then
  SPRING_DATASOURCE_URL="$(printf '%s' "$SPRING_DATASOURCE_URL" | sed 's#^postgres://#jdbc:postgresql://#; s#^postgresql://#jdbc:postgresql://#')"

  # Render yêu cầu SSL cho kết nối PostgreSQL (kể cả internal). Thêm sslmode=require
  # nếu URL chưa có, để tránh lỗi "Unable to determine Dialect" do không nối được DB.
  case "$SPRING_DATASOURCE_URL" in
    *sslmode=*) : ;;
    *\?*)       SPRING_DATASOURCE_URL="${SPRING_DATASOURCE_URL}&sslmode=require" ;;
    *)          SPRING_DATASOURCE_URL="${SPRING_DATASOURCE_URL}?sslmode=require" ;;
  esac

  export SPRING_DATASOURCE_URL
fi

# Đưa cổng Render vào cấu hình nginx.
sed -i "s/__PORT__/${PORT}/g" /etc/nginx/http.d/default.conf

# Chạy nginx + Spring Boot dưới một supervisor duy nhất.
exec /usr/bin/supervisord -n -c /etc/supervisord.conf
