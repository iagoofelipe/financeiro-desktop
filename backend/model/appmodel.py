from dateutil.relativedelta import relativedelta
from configparser import ConfigParser
from dotenv import load_dotenv
from threading import Thread
from typing import Literal
import datetime as dt
import logging as log
import time
import os

from backend.model.consts import BASE_DIR, CFG_FILE, EVT_CONNECTION_RESTORED, EVT_CONNECTION_BROKEN
from backend.model.server import ServerAPI
from backend.event import EventHandler

class AppModel(ServerAPI):
    _instance = None

    def __init__(self):
        load_dotenv(BASE_DIR / '.env')
        super().__init__(conn_error_cb=self._conn_error_cb, conn_error_keep_exception=False)

        self._auto_reconnect_active = False
        self._check_connection = True
        self._connected = False
        self._event_handler = EventHandler()
        self._cfg = ConfigParser()

        if os.path.exists(CFG_FILE):
            with open(CFG_FILE) as f:
                self._cfg.read_file(f)

        self._theme = self._cfg.get('UI', 'theme') if self._cfg.has_option('UI', 'theme') else 'light'

    #---------------------------------------------------------------
    # propriedades
    @property
    def events(self): return self._event_handler

    #---------------------------------------------------------------
    # métodos públicos
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

    def initialize(self):
        if not self.checkConnection():
            self._api_auto_reconnect()
            return False

        self.tryAuthenticateFromCache()
        return True

    def getUserFullName(self) -> str: return self._user.fullname if self._user else ''

    def getDefaultYearMonth(self) -> str:
        today = dt.date.today()
        return (today if today.day <= 10 else today+relativedelta(months=1)).strftime('%Y-%m')

    def tryAuthenticateFromCache(self) -> bool:
        if self._authenticated:
            return True

        if not self._cfg.has_option('Authentication', 'username') or not self._cfg.has_option('Authentication', 'password'):
            return False
        return self.auth(self._cfg['Authentication']['username'], self._cfg['Authentication']['password'])

    def auth(self, username:str, password:str, remember=False):
        if not super().auth(username, password):
            return False

        if remember:
            with open(CFG_FILE, 'w') as f:
                cfg = ConfigParser()
                cfg.update({'Authentication': {'username': username, 'password': password}})
                cfg.write(f)

        return True

    #---------------------------------------------------------------
    # métodos privados
    def _update_cfg(self, **params):
        self._cfg.update(params)
        with open(CFG_FILE, 'w') as f:
            self._cfg.write(f)

    def _conn_error_cb(self):
        self._event_handler.emit(EVT_CONNECTION_BROKEN)
        self._api_auto_reconnect()

    def _api_auto_reconnect(self):
        if not self._auto_reconnect_active:
            Thread(target=self._api_auto_reconnect_loop).start()

    def _api_auto_reconnect_loop(self):
        self._auto_reconnect_active = True
        log.debug('[AppModel] auto reconnect initialized')
        try_again = True

        while try_again:
            time.sleep(3)
            self._connected = self.checkConnection()
            try_again = self._check_connection and not self._connected
            log.debug(f'[AppModel] auto reconnect result: ConnectionSuccess={self._connected} TryAgain={try_again}')

        self._auto_reconnect_active = False
        if self._connected:
            self.events.emit(EVT_CONNECTION_RESTORED)
    
    #---------------------------------------------------------------
