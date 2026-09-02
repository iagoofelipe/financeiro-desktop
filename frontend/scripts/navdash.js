import CategoryChart from "/scripts/components/category-chart.js";
// import { get_invoice_by_card } from "../tools/api/cards.js";
// import { balance, values_by_category } from "../tools/api/statistics.js";

export default class DashboardView {
    #jquery;
    #category_chart;
    #date_ref;

    constructor(jquery, category_chart, jfilter_month_year) {
        this.#jquery = jquery;
        this.#category_chart = category_chart;
        this.#date_ref = jfilter_month_year.val() + '-01';
        
        // jquery.on não deve ser utilizado pelo conteúdo ser movido
        jfilter_month_year.on('change', async (e) => await this.#on_filterMonthYear_changed(e));
        this.#jquery.on('change', '.select-card', async (e) => await this.updateCard());
    }

    //-----------------------------------------------------------------------------
    // Métodos Públicos - Estáticos
    static async create(jfilter_month_year) {
        let jquery = $(await $.get('/ui/navdash.html'));
        let parent = jquery.find('#chart-category');

        // atualizando cartões
        let jselect_card = jquery.find('.select-card');
        let cards = (await window.pywebview.api.model.getCards()).data;
        for(const i in cards) {
            const card = cards[i];
            jselect_card.append(`<option value="${card.id}">${card.name}</option>`)
        }

        let category_chart = new CategoryChart({
            data: {in: [], out: []},
            filterOptions: [
                {value:'out', text: 'Saídas'},
                {value: 'in', text: 'Entradas'},
            ],
            fieldLabel: 'title',
            fieldData: 'total',
            appendTo: parent,
            dataAsObject: true,
        });

        let obj = new DashboardView(jquery, category_chart, jfilter_month_year);
        
        await obj.updateCard();
        await obj.updateCategories();
        await obj.updateBalance();

        return obj;
    }

    //-----------------------------------------------------------------------------
    // Métodos Públicos
    jquery() { return this.#jquery; }

    async updateCard() {
        let response = await window.pywebview.api.model.getInvoiceByCard({
            field: 'id',
            q: this.#jquery.find('.select-card option:selected').val(),
            date_ref: this.#date_ref,
        });

        if (response.success) {
            this.#jquery.find('.field-card-accounted .text').text(response.data.sum_registred_formatted);
            this.#jquery.find('.field-card-pending .text').text(response.data.sum_pending_formatted);
            this.#jquery.find('.field-card-closing-date .text').text(response.data.closing_date_formatted);
            this.#jquery.find('.field-card-due-date .text').text(response.data.due_date_formatted);
        } else {
            this.#jquery.find('.field-card-accounted .text').text('-');
            this.#jquery.find('.field-card-pending .text').text('-');
            this.#jquery.find('.field-card-closing-date .text').text('-');
            this.#jquery.find('.field-card-due-date .text').text('-');
        }
    }

    async updateBalance() {
        const response = await window.pywebview.api.model.getBalance({date_ref: this.#date_ref});
        
        if (response.success) {
            this.#jquery.find('.value-in').text(response.data.total_in_formatted);
            this.#jquery.find('.value-out').text(response.data.total_out_formatted);
            this.#jquery.find('.value-balance').text(response.data.total_balance_formatted);

            if (response.data.total_in_progress_description) {
                this.#jquery.find('.value-in-note').show();
                this.#jquery.find('.value-in-note .icon-progress').prop('hidden', !response.data.total_in_progress);
                this.#jquery.find('.value-in-note .icon-not-progress').prop('hidden', response.data.total_in_progress);
                this.#jquery.find('.value-in-note .text').text(response.data.total_in_progress_description);
            }
            else this.#jquery.find('.value-in-note').hide();

            if (response.data.total_out_progress_description) {
                this.#jquery.find('.value-out-note').show();
                this.#jquery.find('.value-out-note .icon-progress').prop('hidden', !response.data.total_out_progress);
                this.#jquery.find('.value-out-note .icon-not-progress').prop('hidden', response.data.total_out_progress);
                this.#jquery.find('.value-out-note .text').text(response.data.total_out_progress_description);
            }
            else this.#jquery.find('.value-out-note').hide();

        } else {
            this.#jquery.find('.value-in').text('0');
            this.#jquery.find('.value-out').text('0');
            this.#jquery.find('.value-balance').text('0');
        }
    }

    async updateCategories() {
        let response = await window.pywebview.api.model.getValuesByCategory({
            date_ref: this.#date_ref,
            limit: 5,
        });

        this.#category_chart.setValues(response.success? response.data : {in: [], out: []});
    }

    //-----------------------------------------------------------------------------
    // Eventos
    async #on_filterMonthYear_changed(evt) {
        this.#date_ref = evt.currentTarget.value + '-01';

       await this.updateCategories();
       await this.updateCard();
       await this.updateBalance();
    }

    //-----------------------------------------------------------------------------
    // Métodos Privados

    //-----------------------------------------------------------------------------
}