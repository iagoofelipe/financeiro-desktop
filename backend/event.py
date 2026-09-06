import logging as log

class EventHandler:
    def  __init__(self):
        self._callbacks = {}

    def emit(self, event:str, *args, **kwargs):
        log.debug(f'[EventHandler] emitting event {event}')
        
        if event not in self._callbacks:
            return
        
        for cb in self._callbacks[event]:
            cb(*args, **kwargs)

    def bind(self, event:str, callback):
        if event not in self._callbacks:
            self._callbacks[event] = set()

        self._callbacks[event].add(callback)

    def unbind(self, event:str, callback):
        cbs = self._callbacks.get(event)
        if cbs and callback in cbs:
            cbs.remove(callback)