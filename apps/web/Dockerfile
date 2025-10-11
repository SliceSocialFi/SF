FROM nginx:alpine

# Copy build đã có sẵn (dist) vào nginx
COPY dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Run nginx
CMD ["nginx", "-g", "daemon off;"]