// import RegistryView from "./nav-regs/view.js";
import DashboardView from "./navdash.js";
// import CreditCardView from "./cards.js";

$(async () => {
    let elements = $('.replace');
    let len = elements.length;

    for(let i=0; i<len; i++) {
        let e = $(elements[i]);
        let response = await fetch(e.attr('url'));
        let svgText = await response.text();
        
        e.replaceWith(svgText);
    }

    $('.user-full-name').text(await window.pywebview.api.model.getUserFullName());

    let home_view = new HomeView();
});

class HomeView
{
    constructor() {
        // configurando nav-btns
        let nav_btns = $('.home-nav .nav-link');
        
        nav_btns.on('click', async (evt) => await this.#on_navBtn_clicked(evt));
        $(nav_btns[0]).click();
        $('#btn-nav-collapse').click(this.#on_btnNavCollapse_clicked);

        $('.home-nav.offcanvas .nav-link').click(() => { $('.home-nav.offcanvas .close').click() });
    }

    async #on_navBtn_clicked(evt) {
        evt.preventDefault();

        let jbtn = $(evt.currentTarget);
        let title = jbtn.prop('name');
        let jfilter_month_year = $('#filter-month-year');

        // atualizando conteúdo
        let new_widget;

        switch (title) {
        case 'Dashboards':
            new_widget = await DashboardView.create(jfilter_month_year);
            break;

        // case 'Registros':
        //     new_widget = await RegistryView.create(jfilter_month_year);
        //     break;

        // case 'Cartões e Faturas':
        //     let cardsview = await CreditCardView.create(parent);
        //     break;

        // case 'Sair':
        //     let response = await $.get('/login/logout');
        //     if (response.success)
        //         window.location.reload();
        //     else
        //         alert('não foi possível realizar o logout');

        //     return;

        default:
            console.log('nav option unset', title);
            return;
        }
        
        $('#home-title').text(title); // atualizando título
        this.#update_nav_button(title); // atualizando botão selecionado
        
        // atualizando conteúdo
        let jquery = new_widget.jquery();
        $('#home-content').html(jquery);
        $('#home-navtop').html(jquery.find('#home-navtop-content'));
    }

    #update_nav_button(name) {
        $('.home-nav .nav-link-active').removeClass('nav-link-active');
        $(`.home-nav .nav-link[name="${name}"]`).addClass('nav-link-active');
    }

    #on_btnNavCollapse_clicked(evt) {
        $('.home-nav').toggleClass('collapsed');
    }
}