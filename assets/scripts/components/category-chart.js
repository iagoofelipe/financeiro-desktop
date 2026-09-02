export default class CategoryChart extends EventTarget {
    #chart;
    #jquery;
    #field_label;
    #field_data;
    #data_as_object;
    #data;
    #use_filter;

    constructor(params) {
        super();
        this.#field_label = params.fieldLabel ?? 'label';
        this.#field_data = params.fieldData ?? 'data';
        this.#data_as_object = params.dataAsObject ?? false;
        this.#data = params.data;
        this.#use_filter = Boolean(params.filterOptions);

        let select_form = '';
        if (this.#use_filter) {
            select_form = '<select class="form-select w-auto">';

            params.filterOptions.forEach(element => {
                select_form += `<option value="${element.value}">${element.text}</option>`;
            });

            select_form += '</select>'
        }

        this.#jquery = $(
            `<div class="card p-3 shadow-sm">
                <div class="d-flex flex-row align-items-top justify-content-between">
                <p class="title m-0">Categorias</p>
                ${select_form}
                </div>
                <canvas id="canvas-chart" class="p-3"></canvas>
            </div>`
        );

        this.#jquery.on('change', '.form-select', () => this.update());
        this.#jquery.appendTo(params.appendTo ?? 'body');
        let labels, data;

        if (this.#data_as_object) {
            let r = this.#get_data_labels_from_obj();
            labels = r.labels;
            data = r.data;
        } else {
            labels = params.labels;
            data = params.data;
        }
        
        this.#chart = new Chart(this.#jquery.find('#canvas-chart')[0], {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        'rgb(22, 51, 74)',
                        'rgb(47, 86, 117)',
                        'rgb(60, 115, 158)',
                        'rgb(89, 139, 179)',
                        'rgb(112, 159, 196)',
                        'rgb(135, 185, 224)',
                        'rgb(131, 199, 252)',
                        'rgb(171, 213, 245)',
                        'rgb(200, 227, 247)',
                    ],
                }]
            },
            options: {
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: CategoryChart.#cb_label
                        }
                    }
                }
            }
        });
    }

    setValues(data) {
        this.#data = data;
        this.update();
    }

    static #cb_label(context) {
        // Formata o número como moeda Real (R$)
        return context.parsed.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    update() {
        let data_labels = this.#get_data_labels_from_obj();

        this.#chart.data.datasets[0].data = data_labels.data;
        if (data_labels.labels)
            this.#chart.data.labels = data_labels.labels;
        
        this.#chart.update();
    }

    #get_data_labels_from_obj() {
        let data;
        let labels = undefined;

        if (this.#data_as_object) {
            let obj;
            data = [];
            labels = [];

            if (this.#use_filter) {
                obj = this.#data[this.#jquery.find('.form-select').val()];
            } else {
                obj = this.#data;
            }

            for (const i in obj) {
                data.push(obj[i][this.#field_data]);
                labels.push(obj[i][this.#field_label]);
            }

        } else {
            data = this.#use_filter? this.#data[this.#jquery.find('.form-select').val()] : this.#data;
        }

        return {data: data, labels: labels};
    }
}