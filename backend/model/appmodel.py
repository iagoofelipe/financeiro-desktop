from configparser import ConfigParser
import requests
import os
from dotenv import load_dotenv
from threading import Thread
import datetime as dt
from dateutil.relativedelta import relativedelta
from typing import Literal

from backend.model.consts import BASE_DIR, CFG_FILE
from backend.model.server import ServerAPI

class AppModel(ServerAPI):
    _instance = None

    def __init__(self):
        load_dotenv(BASE_DIR / '.env')
        super().__init__()

        self._check_connection = True
        self._cfg = ConfigParser()

        if os.path.exists(CFG_FILE):
            with open(CFG_FILE) as f:
                self._cfg.read_file(f)

        self._theme = self._cfg.get('UI', 'theme') if self._cfg.has_option('UI', 'theme') else 'light'

    @classmethod
    def getInstance(cls):
        if cls._instance is None:
            cls._instance = AppModel()
        return cls._instance

    def setTheme(self, theme:Literal['dark', 'light']):
        self._update_cfg(UI={'theme': theme})
        self._theme = theme

    def getTheme(self) -> Literal['dark', 'light']:
        return self._theme

    def close(self):
        self._check_connection = False

    def logout(self):
        self._update_cfg(Authentication={})
        return super().logout()

    def _update_cfg(self, **params):
        self._cfg.update(params)
        with open(CFG_FILE, 'w') as f:
            self._cfg.write(f)

    def initialize(self):
        if not self.checkConnection():
            return False

        if not self._cfg.has_option('Authentication', 'username') or not self._cfg.has_option('Authentication', 'password'):
            return True

        self.auth(self._cfg['Authentication']['username'], self._cfg['Authentication']['password'])
        return True

    def getUserFullName(self) -> str: return self._user.fullname if self._user else ''

    def getDefaultYearMonth(self) -> str:
        today = dt.date.today()
        return (today if today.day <= 10 else today+relativedelta(months=1)).strftime('%Y-%m')

    def auth(self, username:str, password:str, remember=False):
        if not super().auth(username, password):
            return False

        if remember:
            with open(CFG_FILE, 'w') as f:
                cfg = ConfigParser()
                cfg.update({'Authentication': {'username': username, 'password': password}})
                cfg.write(f)

        return True

    def createAccount(self, data:dict) -> tuple[bool, str]:
        success = super().createAccount(**data)
        return success, (self._error if not success else '')

    def getInvoiceByCard(self, params:dict):
        response = dict(success=False, error='', data=None)
        r = requests.get(self._host+'/getInvoiceByCard', params, headers=self._headers)

        if r.status_code == 200:
            response['success'] = True
            response['data'] = r.json()
        else:
            response['error'] = r.json()['detail']

        return response

    def getCards(self):
        data = super().getCards(parse_dataclass=False)
        success = data is not None
        return dict(success=success, error='' if success else self._error, data=data)

    def getBalance(self, params):
        response = dict(success=False, error='', data=None)
        r = requests.get(self._host+'/balance', params, headers=self._headers)

        if r.status_code == 200:
            response['success'] = True
            response['data'] = r.json()
        else:
            response['error'] = r.json()['detail']

        return response

    def getValuesByCategory(self, params):
        params['parse_dataclass'] = False
        data = super().valuesByCategory(**params)
        success = data is not None
        return dict(success=success, error='' if success else self._error, data=data)
