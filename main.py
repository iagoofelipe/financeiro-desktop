from backend.app import FinanceiroApp
import logging as log
import sys

if __name__ == '__main__':
    log.basicConfig(level=log.DEBUG if (len(sys.argv) > 1 and sys.argv[1] == 'DEBUG') else log.INFO)

    app = FinanceiroApp()
    app.exec()
