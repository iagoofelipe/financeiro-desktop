import { MODAL_FLAGS, set_modal } from "./tools/utils.js";

$('#btn-auth').on('click', on_auth);
$('#btn-create').on('click', on_create);

async function on_auth() {
    const username = $('#inp-username').val();
    const password = $('#inp-password').val();
    const remember = $('#inp-remember').prop('checked');
    
    if (!username || !password) {
        set_modal('Validação de Parâmetros', 'preencha todos os campos!', true, MODAL_FLAGS.HIDE_HEADER_BTN_CLOSE);
        return;
    }
    
    const form_controls = $('#login-inputs .form-control, #login-inputs .btn');
    form_controls.prop('disabled', true);

    let response = await window.pywebview.api.model.auth(username, password, remember);
    form_controls.prop('disabled', false);

    if (!response) {
        set_modal('Validação de Parâmetros', 'usuário ou senha incorretos!', true, MODAL_FLAGS.HIDE_HEADER_BTN_CLOSE);
        return;
    }

    window.location.href = '/ui/home.html';
}

export async function on_create() {
    let inputs = {};
    let inp_components = $('.form-control');
    let len = inp_components.length;
    let any_empty = false;

    for (let i = 0; i < len; i++) {
        let component = $(inp_components[i]);
        let val = component.val();
        inputs[component.attr('name')] = val;
        any_empty |= !val;
    }

    if (any_empty) {
        set_modal('Validação de parâmetros', 'Preencha todos os campos!', true, MODAL_FLAGS.HIDE_HEADER_BTN_CLOSE);
        return;
    }

    if (inputs.password != inputs.password_confirm) {
        set_modal('Validação de parâmetros', 'As senhas são diferentes!', true, MODAL_FLAGS.HIDE_HEADER_BTN_CLOSE);
        return;
    }

    delete inputs.password_confirm;
    inp_components.prop('disabled', true);
    let response = await window.pywebview.api.model.createAccount(inputs);
    let success = response[0];
    let error = response[1];
    
    inp_components.prop('disabled', false);
    if (!success) {
        set_modal('Criação de Usuário', error, true, MODAL_FLAGS.HIDE_HEADER_BTN_CLOSE);
        return;
    }

    window.location.href = '/ui/login.html';
}