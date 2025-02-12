FROM nginx:1.25

# Remove the default configuration
RUN rm /etc/nginx/conf.d/default.conf

# COPY nginx.conf /etc/nginx/nginx.conf
COPY conf.d/default.conf  /etc/nginx/nginx.conf
# Copy any additional configuration files (optional)
COPY conf.d/ /etc/nginx/conf.d/


COPY ssl/ /etc/nginx/ssl/


EXPOSE 80
EXPOSE 443
