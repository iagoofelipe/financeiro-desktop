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

export async function replace_from_url(root) {
    let elements = $(root).find('.replace');
    let len = elements.length;

    if (!('urls' in globalThis)) {
        globalThis.urls = {};
    }

    for(let i=0; i<len; i++) {
        let e = $(elements[i]);
        let url = e.attr('url');

        if (!(url in globalThis.urls)) {
            let response = await fetch(url);
            globalThis.urls[url] = await response.text();
        }
        
        e.replaceWith(globalThis.urls[url]);
    }
}

export function setup_select_input(root, id_select, id_select_group, id_btn_reset) {
    let jroot = $(root);
    let btn = '#'+id_btn_reset;
    let select = '#'+id_select;
    let select_group = '#'+id_select_group;
    let select_group_form = '#'+id_select_group+' .form';

    jroot.find(select).attr('select-parent', select_group).show();
    jroot.find(select_group).hide();
    jroot.find(select_group_form).attr('select-parent', select);
    jroot.find(btn).attr({'select-parent': select, 'select-group-parent': select_group});

    jroot.on('change', select, on_select_change);
    jroot.on('change', select_group_form, on_selectGroup_change);
    jroot.on('click', btn, on_btnReset_click);

    function on_select_change(evt) {
        let val = evt.currentTarget.value;
        let obj = $(evt.currentTarget);
        let parent = $(obj.attr('select-parent'));
        let form = parent.find('.form');

        obj.hide();
        parent.show();
        
        if (val && form.val() != val)
            form.val(val).change();
    }

    function on_selectGroup_change(evt) {
        let val = evt.currentTarget.value;
        let obj = $(evt.currentTarget);
        let parent = $(obj.attr('select-parent'));

        if (parent.val() != val)
            parent.val(val).change();
    }

    function on_btnReset_click(evt) {
        let obj = $(evt.currentTarget);
        let select = $(obj.attr('select-parent'));
        let select_group = $(obj.attr('select-group-parent'));

        select.val('').change();
        select.show();
        select_group.hide();
    }
}