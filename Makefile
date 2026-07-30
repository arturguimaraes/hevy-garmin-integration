.PHONY: install build run dev test clean

install:
	uv pip install -e ".[dev]"
	cd frontend && npm install

build:
	cd frontend && npm run build
	rm -rf backend/app/static
	cp -r frontend/dist backend/app/static

run: build
	hevy-garmin

dev:
	@echo "Start two terminals:"
	@echo "  Terminal 1: cd backend && uvicorn app.main:app --reload --host 127.0.0.1 --port 8765"
	@echo "  Terminal 2: cd frontend && npm run dev"

test:
	pytest backend/tests/
	cd frontend && npm test

clean:
	rm -rf frontend/dist backend/app/static __pycache__ .pytest_cache
