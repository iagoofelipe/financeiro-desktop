export const DEFAULT_ERROR = 'Não foi possível realizar a operação';

export const REG_STATUS_HTML = {
    PENDING: '<span class="card-status card-status-pendente" title="o registro está dentro do prazo">Pendente</span>',
    ACCOUNTED: '<span class="card-status card-status-pendente" title="o registro foi contabilizado, porém não pago">Contabilizado</span>',
    OK: '<span class="card-status card-status-pago" title="o registro foi contabilizado e pago">Pago</span>',
    LATE: '<span class="card-status card-status-atrasado" title="o registro está fora do prazo previsto">Atrasado</span>',
};

export function getElementsByXPath(xpath, context = document) {
    let result = document.evaluate(xpath, context, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    let array = [];

    for (let i = 0; i < result.snapshotLength; i++) {
        array.push(result.snapshotItem(i));
    }

    return array;
}

export const MODAL_FLAGS = {
    HIDE_TITLE: 1 << 1,
    HIDE_HEADER_BTN_CLOSE: 1 << 2,
    HIDE_FOOTER: 1 << 3,
};

export function set_modal(title, html_body, show = true, flags = 0) {
    $('#modalLabel').text(title);
    $('#modal .modal-body').html(html_body);
    
    $('#modal .modal-header').toggle(!(flags & MODAL_FLAGS.HIDE_TITLE));
    $('#modal .modal-header .btn-close').toggle(!(flags & MODAL_FLAGS.HIDE_HEADER_BTN_CLOSE));
    $('#modal .modal-footer').toggle(!(flags & MODAL_FLAGS.HIDE_FOOTER));

    if (show) {
        let modal = new bootstrap.Modal('#modal');
        modal.show();
    }
}