// TODO: check if jQuery is loaded
// TODO: query only in this elements
$.fn.irieTable = function (config, data) {
    var irieTable = this;
    var tableModel = {
        columns: [],
        server: false,
        replacePrePostFix: "##",
        filter: false,
        pagination: false,
        updatePages: function () {
            this.pagination.pages = parseInt(this.pagination.count / this.pagination.maxValues);
            this.pagination.pages = this.pagination.pages === 0 ? 1 : this.pagination.pages;
        },
        updateConfig: {
            render: {
                filterTextfield: false,
                paginationMaxValues: false,
                paginationPageControl: false
            },
            filterUpdateRequired: false
        },
        currentData: [],
        responseData: undefined
    };
    
    this.updateTable = updateTable = function(restart){
        tableModel.updateConfig.isFirstUpdate = true;
        tableModel.updateConfig.render.paginationMaxValues = tableModel.pagination;
        tableModel.updateConfig.render.paginationPageControl = tableModel.pagination;
        tableModel.updateConfig.render.filterTextfield = tableModel.filter;
        tableModel.updateConfig.filterUpdateRequired = tableModel.filter;
        update(restart);
    };

    this.serverConfig = serverConfig = function (config) {
        if(arguments.length > 0){
            if(config.hasOwnProperty("url") && config.hasOwnProperty("responseDataProperty")){
                if(config.url !== undefined && config.url !== "" && config.responseDataProperty !== undefined && config.responseDataProperty !== ""){
                    tableModel.server = {};
                    tableModel.server.url = config.url;
                    tableModel.server.responseDataProperty = config.responseDataProperty;
                }
                else{
                    throw "IRIE_TABLE_ERROR: Invalid server - The server config must contain url & responseData"
                }
            }
            else{
                throw "IRIE_TABLE_ERROR: Invalid server - The server config must contain url & responseData"
            }
        }
        return tableModel.server;
    };

    this.dataSet = dataSet = function (dataSet) {
        if(arguments.length > 0 ){
            if(typeof dataSet === "object"){
                tableModel.responseData = dataSet;
                tableModel.updateConfig.filterUpdateRequired = true;
                update()
            }
            else {
                throw "IRIE_TABLE_ERROR: Invalid dataSet provided"
            }
        }
        return tableModel.responseData;
    };

    this.filterConfig = filterConfig =  function (config) {
        //TODO: check if html markup is there and valid
        if(arguments.length > 0){
            if(config === true || typeof config === "object"){
                tableModel.filter = {};
                tableModel.filter.filterText = config.hasOwnProperty("filterText") ? config.filterText : "";
                if(config.hasOwnProperty("filterByServer")){
                    tableModel.filter.filterByServer = {};
                    if(config.filterByServer.hasOwnProperty("filterUrlParameter")){
                        tableModel.filter.filterUrlParameter = config.filterUrlParameter
                    }
                }
                else{
                    tableModel.filter.filterByServer = false;
                }
            }
        }
        return tableModel.filter;
    };

    this.paginationConfig = paginationConfig = function (config) {
        if (arguments.length > 0) {
            if (config === true || typeof config === "object") {
                tableModel.pagination = {
                    count: undefined,
                    page: 1,
                    pages: undefined
                };

                tableModel.pagination.page = config.hasOwnProperty("page") ? config.page : 1;
                tableModel.pagination.maxValues = config.hasOwnProperty("maxValues") ? config.maxValues : 10;
                tableModel.pagination.maxValueSelect = config.hasOwnProperty("maxValueSelect") ? config.maxValueSelect : [10, 25, 50];
                tableModel.pagination.morePagesIndicators = config.hasOwnProperty("morePagesIndicators") ? config.morePagesIndicators : false;
                tableModel.pagination.maxPaginationButtons = config.hasOwnProperty("maxPaginationButtons") ? config.maxPaginationButtons : 5;

                if(config.hasOwnProperty("paginateByServer")){
                    if (config === true || typeof config === "object") {
                        tableModel.pagination.offsetUrlParameter = config.paginateByServer.hasOwnProperty("offsetUrlParameter") ? config.paginationByServer.offsetUrlParameter : tableModel.pagination.offsetUrlParameter;
                        tableModel.pagination.maxValueParameter = config.paginateByServer.hasOwnProperty("maxValueParameter") ? config.paginationByServer.maxValueParameter : tableModel.pagination.maxValueParameter;
                        tableModel.pagination.responseCountProperty = config.paginateByServer.hasOwnProperty("responseCountProperty") ? config.paginationByServer.responseCountProperty: tableModel.pagination.responseCountProperty;
                    }
                    else{
                        tableModel.pagination.paginationByServer = false;
                    }
                }
            }
        }
        this.buttonListenersConfig = buttonListenersConfig = function (config) {
            if (arguments.length > 0) {
                tableModel.buttonListeners = config;
            }
        };
        return tableModel.pagination;
    };

    //------------------------------------ init functions ------------------------------------>
    function configSetup(){
        if(config.hasOwnProperty("server")){
            serverConfig(config.server)
        }
        if(config.hasOwnProperty("replacePrePostFix")) {
            if (config.replacePrePostFix === undefined || config.replacePrePostFix === "") {
                throw "IRIE_TABLE_ERROR: The provided replacePrePostFix is not valid"
            }
            else{
                tableModel.replacePrePostFix = config.replacePrePostFix;
            }
        }
        if(config.hasOwnProperty("filter")){
            filterConfig(config.filter)
        }
        if(config.hasOwnProperty("pagination")){
            paginationConfig(config.pagination)
        }
        if(config.hasOwnProperty("buttonListeners")){
            buttonListenersConfig(config.buttonListeners)
        }
        //TODO: Set server pagination & filter to false if data set is present
        console.log(tableModel);
    }

    function readTableTemplate(){
        irieTable.find( "tbody tr td" ).each(function (index) {
            tableModel.columns[index] = {};
            tableModel.columns[index]["html"] = $(this).wrap('<div>').parent().html();
            $(this).unwrap();
        });
        if(tableModel.filter){
            var filterColumns = undefined;
            try{
                filterColumns = JSON.parse(irieTable.find("#sp-filter-column").attr('response'));
            }
            catch(err) {console.error(err)}
            tableModel.filter.filterColumns = filterColumns;
        }
        // TODO: Read out pagination and filter elements and prepare render funtions
    }

    //------------------------------------ render functions ------------------------------------>
    function renderPaginationMaxValueSelect(){
        var maxValuesSelect = $("#sp-max-values" );
        maxValuesSelect.empty();
        var html =
            '<div class="form-group">'+
                '<label for="sp-max-values-select">Values per site:</label>'+
                '<select class="form-control" id="sp-max-values-select">';
                    for(var i = 0; i < tableModel.pagination.maxValueSelect.length; i++){
                        html += '<option value="' + tableModel.pagination.maxValueSelect[i]+ '" class="sp-max-value-item">' + tableModel.pagination.maxValueSelect[i]+ '</option>';
                    }
                    html +=
                '</select>'+
            '</div>';
        maxValuesSelect.append(html);
        $('select#sp-max-values-select option[value="' + tableModel.pagination.maxValues.toString() + '"]').attr("selected", true);
    }

    function renderFilterTextfield(){
        var maxValuesSelect = $("#sp-filter-input" );
        maxValuesSelect.empty();
        var html =
            '<div class="form-group">'+
                '<label for="sp-filter-textfield">Filter:</label>'+
                '<input type="text" class="form-control" id="sp-filter-textfield" value="'+ tableModel.filter.filterText +'">'+
            '</div>';
        maxValuesSelect.append(html);
    }

    function renderTable(){
        var tbody = irieTable.children( "tbody" );
        tbody.empty();
        for (var i = 0; i < tableModel.currentData.length; i++){
            var html = "<tr>";
            for(var j = 0; j < tableModel.columns.length; j++){
                var column = tableModel.columns[j].html;
                // TODO: check whole tableRow
                // TODO: make regex dynamic
                var matches = column.match(/\#\#(.*?)\#\#/g);
                // TODO: Kick out doubles
                if(matches !== null){
                    for(var k  = 0; k < matches.length; k++ ){
                        column = column.replace(matches[k], tableModel.currentData[i][matches[k].replace(/##/g,"")])
                    }
                }
                html += column;
            }
            html += "<tr>";
            tbody.append(html);
        }
    }

    function renderPaginationPageControl(pages, current, max, morePagesIndicators){
        var tfoot = irieTable.children( "tfoot" );
        tfoot.empty();
        var html =
            '<ul class="pagination">'+
                '<li class="page-item';
                if(current === 1){
                    html += ' disabled';
                }
                html += '"><a class="sp-previous-page"><</a></li>';



                var middle = parseInt(max / 2);
                var moreBevore = current > middle+1;
                // TODO fix moreAfter -> works only with filter
                var moreAfter = current < pages-middle;



        
                if(moreBevore && morePagesIndicators){
                    html += '<li class="page-item disabled"><a>...</a></li>';
                }
                var pageButtonStart = current - middle;
                var pageButtonEnd = current + middle;
                if(pageButtonStart < 1){
                    pageButtonStart = 1;
                    if(current / middle < 1 ){
                        pageButtonEnd += middle;
                    }
                    else{
                        pageButtonEnd += current / middle;
                    }
                }
                if(pageButtonEnd > pages){
                    pageButtonStart -= (pageButtonEnd - pages);
                    if(pageButtonStart < 1){pageButtonStart=1}
                    pageButtonEnd = pages;
                }
                for (var i = pageButtonStart; i < pageButtonEnd+1; i++){
                    html += '<li class="page-item';
                    if (current === i) {
                        html += " active";
                    }
                    html += '"><a class="sp-page">' + (i) + '</a></li>';
                }
                if(moreAfter && morePagesIndicators){
                    html += '<li class="page-item disabled"><a>...</a></li>';
                }
                html += '<li class="page-item';
                if(current === pages){
                    html += ' disabled';
                }
                html +=
                    '"><a class="sp-next-page">></a></li>' +
            '</ul>';
        tfoot.append(html);
    }

    //------------------------------------ button listeners ------------------------------------>
    function addButtonListeners(){
        if(tableModel.updateConfig.render.paginationPageControl) {
            irieTable.find("tfoot ul li a").each(function () {
                var paginationButton = $(this);
                if (!$(this).parent().hasClass("disabled")) {
                    paginationButton.click(function () {
                        if (paginationButton.hasClass("sp-page")) {
                            tableModel.pagination.page = parseInt(paginationButton.text());
                        }
                        if (paginationButton.hasClass("sp-next-page")) {
                            tableModel.pagination.page += 1;
                        }
                        if (paginationButton.hasClass("sp-previous-page")) {
                            tableModel.pagination.page -= 1;
                        }
                        tableModel.updateConfig.render.paginationPageControl = true;
                        update();
                    });
                }
            });
        }
        if(tableModel.updateConfig.render.paginationMaxValues) {
            $("#sp-max-values-select").change(function () {
                tableModel.pagination.maxValues = parseInt($(this).val());
                tableModel.updatePages();
                tableModel.pagination.page = 1;
                tableModel.updateConfig.render.paginationMaxValues = true;
                tableModel.updateConfig.render.paginationPageControl = true;
                update();
            });
        }
        if(tableModel.updateConfig.render.filterTextfield) {
            $("#sp-filter-textfield").on("keyup", function () {
                var val = this.value;
                if (val !== tableModel.filter.filterText) {
                    tableModel.pagination.page = 1;
                    tableModel.filter.filterText = val;
                    tableModel.updateConfig.render.paginationPageControl = true;
                    tableModel.updateConfig.filterUpdateRequired = true;
                    update();
                }
            });
        }
        for(var i = 0; i < tableModel.buttonListeners.length; i++){
            var query = '.' + tableModel.buttonListeners[i].class;
            $(query).each(function () {
                $(this).on(tableModel.buttonListeners[i].on, tableModel.buttonListeners[i].action)
            })
        }
    }

    //------------------------------------ table logic functions ------------------------------------>
    function render() {
        if(tableModel.updateConfig.render.filterTextfield && tableModel.filter){
            renderFilterTextfield();
        }
        if(tableModel.updateConfig.render.paginationMaxValues && tableModel.pagination){
            renderPaginationMaxValueSelect();
        }
        if(tableModel.updateConfig.render.paginationPageControl && tableModel.pagination){
            renderPaginationPageControl(tableModel.pagination.pages, tableModel.pagination.page, tableModel.pagination.maxPaginationButtons, tableModel.pagination.morePagesIndicators);
        }
        renderTable();
        addButtonListeners();
        resetUpdateConfig();
    }

    function getDataByAjax() {
        var url = tableModel.server.url;
        if(tableModel.filter.filterByServer){
            url += "?" + tableModel.filter.filterByserver.filterUrlParam + "=" + tableModel.filter.filterText
        }
        if(tableModel.pagination.paginationByServer){
            var offset = tableModel.pagination.page * tableModel.pagination.maxValues;
            var max = tableModel.pagination.maxValues;
            url += "?" + tableModel.filter.filterByserver.offsetUrlParam + "=" + offset;
            url += "?" + tableModel.filter.filterByserver.maxUrlParam + "=" + max;
        }
        return $.ajax({
            url: url,
            method: 'GET'
        })
    }

    function resetUpdateConfig() {
        tableModel.updateConfig = {
            "render": {
                "filterTextfield": false,
                "paginationMaxValues": false,
                "paginationPageControl": false
            }
        };
    }

    function update (isFirstUpdate) {
        if(isFirstUpdate){
            if(data){
                tableModel.responseData = data;
                tableModel.pagination.count = tableModel.responseData.length;
                startWorking();
            }
            else {
                getDataByAjax().then(function (response) {
                    tableModel.responseData = tableModel.server.responseDataProperty ? tableModel.responseData = response[tableModel.server.responseDataProperty] :  tableModel.responseData = response;
                    if (tableModel.pagination) {
                        tableModel.pagination.count = tableModel.pagination.paginationByServer ? response[tableModel.pagination.paginationByServer.responseCountProperty] : tableModel.pagination.count = tableModel.responseData.length;
                    }
                    startWorking();
                });
            }
        }
        else{
            startWorking();
        }
        function startWorking() {
            var toDo;
            if(!tableModel.pagination  && !tableModel.filter) {
                toDo = "nothing";
                tableModel.currentData = tableModel.responseData;
                render();
            }
            if(tableModel.filter && !tableModel.filter.filterByServer && !tableModel.pagination){
                toDo = "filterLocal";
                //TODO: implement
            }
            if(tableModel.pagination && !tableModel.pagination.paginationByServer && !tableModel.filter){
                toDo = "paginateLocal";
                tableModel.currentData = paginateLocal(tableModel.responseData);
                render();
            }
            if(tableModel.pagination && !tableModel.pagination.paginationByServer && tableModel.filter && !tableModel.filter.filterByServer){
                toDo = "paginateAndFilterLocal";
                if(tableModel.updateConfig.filterUpdateRequired){
                    var t0 = performance.now();
                    tableModel.filter.tempFilterData = filterLocal(tableModel.filter.filterText, tableModel.filter.filterColumns);
                    var t1 = performance.now();
                    console.log("Filtering took " + (t1 - t0) + " milliseconds.");
                    tableModel.pagination.count = tableModel.filter.tempFilterData.length;
                }
                tableModel.currentData = paginateLocal(tableModel.filter.tempFilterData);
                tableModel.updatePages();
                render();
            }
            if(tableModel.pagination && tableModel.pagination.paginationByServer && !tableModel.filter){
                toDo = "paginateByServer";
                getDataByAjax().then(function (response) {
                    tableModel.responseData = tableModel.currentData = response[tableModel.server.responseDataProperty];
                    tableModel.pagination.count = response[tableModel.pagination.paginationByServer.responseCountProperty];
                    tableModel.updatePages();
                    render();
                });
            }
            if(tableModel.pagination && tableModel.pagination.paginationByServer && tableModel.filter && tableModel.filterByServer){
                toDo = "filterAndPaginateByServer";
                getDataByAjax().then(function (response) {
                    tableModel.responseData = tableModel.currentData = response[tableModel.server.responseDataProperty];
                    tableModel.pagination.count = response[tableModel.pagination.paginationByServer.responseCountProperty];
                    tableModel.updatePages();
                    render();
                });
            }
            if(tableModel.pagination && !tableModel.pagination.paginationByServer && tableModel.filter && tableModel.filterByServer){
                toDo = "filterByServerAndPaginateLocal";
                getDataByAjax().then(function (response) {
                    tableModel.responseData = response;
                    tableModel.pagination.count = response.length;
                    tableModel.currentData = paginateLocal(tableModel.responseData);
                    tableModel.updatePages();
                    render();
                });
            }
        }
    }

    //------------------------------------ local filter / pagination functions ------------------------------------>
    function filterLocal(text, columns){
        function checkForMatch(element){
            var found = false;
            for(var i = 0; i < columns.length; i++){
                //TODO: fix local data filter
                if(element[columns[i]].indexOf(text) !== -1){
                    found = true;
                }
            }
            return found ;
        }
        return tableModel.responseData.filter(checkForMatch)
    }

    function paginateLocal(toPaginate){
        var from = (tableModel.pagination.page - 1) * tableModel.pagination.maxValues;
        var to = (tableModel.pagination.page - 1) * tableModel.pagination.maxValues + tableModel.pagination.maxValues;
        return toPaginate.slice(from, to);
    }

    //------------------------------------ start point ------------------------------------>
    configSetup();
    readTableTemplate();
    updateTable(true);
    return this;
};