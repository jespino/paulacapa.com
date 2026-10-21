PORT ?= 8000

.PHONY: serve
serve: ## Sirve la web en la red local (http://<ip>:$(PORT))
	python3 scripts/serve.py . $(PORT)
