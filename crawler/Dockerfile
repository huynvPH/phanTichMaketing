FROM python:3.12-slim

# Install system utilities
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install uv for fast python dependency resolution
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Create non-root user (Hugging Face Spaces runs as UID 1000)
RUN useradd -m -u 1000 appuser
WORKDIR /app

# Copy dependencies manifest
COPY pyproject.toml uv.lock* ./

# Install python packages to system python
RUN uv pip install --system -r pyproject.toml

# Install Playwright Chromium and required OS dependencies
RUN playwright install --with-deps chromium

# Copy crawler source code
COPY . .

# Set permissions
RUN chown -R appuser:appuser /app /home/appuser

USER appuser

ENV PORT=7860
ENV HOME=/home/appuser
EXPOSE 7860

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "7860", "--loop", "asyncio"]
