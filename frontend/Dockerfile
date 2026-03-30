# ============================================
# MLM Frontend - Production Image
# ============================================
# Single stage: usa dist/ compilado localmente
FROM nginx:alpine

WORKDIR /app

# Copy nginx config
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy pre-compiled dist from host (compiled during CI/build step)
COPY frontend/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
