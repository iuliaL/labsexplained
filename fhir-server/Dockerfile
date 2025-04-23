FROM hapiproject/hapi:latest

COPY application.yaml /app/application.yaml

ENV HAPI_FHIR_CONFIG_PATH=/app/application.yaml

ENV JAVA_TOOL_OPTIONS="-Xms256m -Xmx512m"
