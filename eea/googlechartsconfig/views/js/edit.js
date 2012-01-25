var chartEditor = null;
var chartId = '';

defaultChart = {
           'chartType':'LineChart',
           "dataTable": [["column1", "column2"], ["A", 1], ["B", 2], ["C", 3], ["D", 2]],
           'options': {'legend':'none'}
    };

available_filter_types = {  0:'Number Range Filter',
                            1:'String Filter',
                            2:'Simple Category Filter',
                            3:'Multiple Category Filter'};

function isValidAddDialog(){
    errorMsgMissing = "" +
        "<div class='googlechart_dialog_errormsg'>" +
            "Required input is missing" +
        "</div>";
    errorMsgInvalid = "" +
        "<div class='googlechart_dialog_errormsg'>" +
            "Required input is not valid" +
        "</div>";
    errorMsgUsed = "" +
        "<div class='googlechart_dialog_errormsg'>" +
            "Required input is already in use" +
        "</div>";
    jQuery('.googlechart_dialog_chartname_div').removeClass('error');
    jQuery('.googlechart_dialog_chartid_div').removeClass('error');

    isValid = true;
    var reText=/^[a-zA-Z][a-zA-Z0-9]*$/;
    jQuery('.googlechart_dialog_errormsg').remove();
    chartId = jQuery(".googlechart_dialog_chartid").val();
    chartName = jQuery(".googlechart_dialog_chartname").val();
    errorOnName = false;
    errorOnId = false;
    if (chartName.trim().length === 0){
        jQuery('.googlechart_dialog_chartname').before(errorMsgMissing);
        errorOnName = true;
        isValid = false;
    }
    if (chartId.trim().length === 0){
        jQuery('.googlechart_dialog_chartid').before(errorMsgMissing);
        errorOnId = true;
        isValid = false;
    }
    else
        if (!reText.test(chartId)){
            jQuery('.googlechart_dialog_chartid').before(errorMsgInvalid);
            errorOnId = true;
            isValid = false;
        }
    alreadyUsed = false;
    var chart_id = jQuery(".googlechart > .googlechart_id");
    inUse = false;
    jQuery(chart_id).each(function(){
        if (chartId == this.value){
            inUse = true;
        }
    });
    if (inUse){
        jQuery('.googlechart_dialog_chartid').before(errorMsgUsed);
        errorOnId = true;
        isValid = false;
    }

    var chart_names = jQuery(".googlechart > .googlechart_name");
    inUse = false;
    jQuery(chart_names).each(function(){
        if (chartName == this.value){
            inUse = true;
        }
    });
    if (inUse){
        jQuery('.googlechart_dialog_chartname').before(errorMsgUsed);
        isValid = false;
        errorOnName = true;
    }
    if (errorOnName){
        jQuery('.googlechart_dialog_chartname_div').addClass('error');
    }
    if (errorOnId){
        jQuery('.googlechart_dialog_chartid_div').addClass('error');
    }
    return isValid;
}

function openAddDialog(){
    jQuery(".googlecharts_addchart_dialog").remove();
    addchartdialog = "" +
        "<div class='googlecharts_addchart_dialog'>" +
            "<div class='googlechart_dialog_chartid_div field'>" +
                "<label>Id</label>" +
                "<span class='required' style='color: #f00;' title='Required'> ■ </span>" +
                "<div class='formHelp'>Id of the chart (e.g. firstchart)</div>" +
                "<input class='googlechart_dialog_chartid' type='text'/>" +
            "</div>" +
            "<div class='googlechart_dialog_chartname_div field'>" +
                "<label>Friendly Name</label>" +
                "<span class='required' style='color: #f00;' title='Required'> ■ </span>" +
                "<div class='formHelp'>Friendly name of the chart (e.g. My first chart)</div>" +
                "<input class='googlechart_dialog_chartname' type='text'/>" +
            "</div>" +
        "</div>";
    jQuery(addchartdialog).dialog({title:"Add Chart",
            modal:true,
            buttons:[
                {
                    text: "Add",
                    click: function(){
                        if (isValidAddDialog()){
                            addChart(jQuery(".googlechart_dialog_chartid").val(),
                                jQuery(".googlechart_dialog_chartname").val());
                            jQuery(this).dialog("close");
                        }
                    }
                },
                {
                    text: "Cancel",
                    click: function(){
                        jQuery(this).dialog("close");
                    }
                }
            ]});
}

function openAdvancedOptions(id){
    var errorMsgJSON = "" +
        "<div class='googlechart_dialog_errormsg'>" +
            "Required input must be a valid JSON" +
        "</div>";

    var chartObj = jQuery("#googlechartid_"+id);
    options = chartObj.find(".googlechart_options").attr("value");

    jQuery(".googlecharts_advancedoptions_dialog").remove();

    advancedOptionsDialog = ""+
        "<div class='googlecharts_advancedoptions_dialog'>"+
            "<div class='googlechart_dialog_options_div field'>" +
                "<label>Options</label>" +
                "<div class='formHelp'><a href='http://code.google.com/apis/chart/interactive/docs/gallery.html'>See GoogleChart documentation</a></div>" +
                "<textarea rows='10' cols='30' class='googlechart_dialog_options'>" +
                options +
                "</textarea>" +
            "</div>" +
        "<div>";
    jQuery(advancedOptionsDialog).dialog({title:"Advanced Options",
            modal:true,
            buttons:[
                {
                    text: "Save",
                    click: function(){
                        advancedOptions = jQuery(".googlechart_dialog_options").val();
                        try{
                            tmpOptions = JSON.parse(advancedOptions);
                            chartObj.find(".googlechart_options").attr("value",advancedOptions);
                            markChartAsModified(id);
                            jQuery(this).dialog("close");
                        }
                        catch(err){
                            jQuery('.googlechart_dialog_options_div').addClass('error');
                            jQuery('.googlechart_dialog_options').before(errorMsgJSON);
                        }
                    }
                },
                {
                    text: "Cancel",
                    click: function(){
                        jQuery(this).dialog("close");
                    }
                }
            ]});
}

function addFilter(id, column, filtertype){
    filter = "<li class='googlechart_filteritem' id='googlechart_filter_"+id+"_"+column+"'>" +
                "<h1 class='googlechart_filteritem_"+id+"'>"+available_columns[column]+"<div class='ui-icon ui-icon-trash remove_filter_icon' title='Delete filter'>x</div></h1>" +
                available_filter_types[filtertype] +
                "<input type='hidden' class='googlechart_filteritem_type' value='"+filtertype+"'/>" +
                "<input type='hidden' class='googlechart_filteritem_column' value='"+column+"'/>" +
             "</li>";
    jQuery(filter).appendTo("#googlechart_filters_"+id);
}

function saveThumb(value){
    DavizEdit.Status.start("Saving Thumb");
    chart_id = value[0];
    chart_json = value[1];
    chart_columns = value[2];
    chart_filters = value[3];
    chart_width = value[4];
    chart_height = value[5];
    chart_filterposition = value[6];
    chart_options = value[7];

    columnlabels = [];
    jQuery(chart_columns).each(function(index,chart_token){
        columnlabels.push(available_columns[chart_token]);
    });

    dataTable = [];
    dataTable.push(columnlabels);

    jQuery(all_rows.items).each(function(index, all_row){
        row = [];
        jQuery(chart_columns).each(function(index,chart_token){
            row.push(all_row[chart_token]);
        });
        dataTable.push(row);
    });
    chart_json.options.width = chart_width;
    chart_json.options.height = chart_height;

    jQuery.each(chart_options,function(key,value){
        chart_json.options[key]=value;
    });

    chart_json.containerId = "googlechart_thumb_zone";
    var chart = new google.visualization.ChartWrapper(
        chart_json
    );

    chart.setDataTable(dataTable);

    google.visualization.events.addListener(chart, 'error', function(event) {
        alert ("Can't generate thumb from the chart called: "+chart_json.options.title);
        DavizEdit.Status.stop("Done");
    });

    google.visualization.events.addListener(chart, 'ready', function(event) {
        thumbObj = jQuery("#googlechart_thumb_form");
        thumbObj.find("#filename").attr("value", "thumb");
        thumbObj.find("#type").attr("value","image/png");
        var svg = jQuery("#googlechart_thumb_zone").find("iframe").contents().find("#chartArea").html();
        thumbObj.find("#svg").attr("value",svg);
        jQuery.post("@@googlechart.setthumb",{"svg":svg},function(data){
            if (data !== "Success"){
                alert ("Can't generate thumb from the chart called: "+chart_json.options.title);
            }
            DavizEdit.Status.stop("Done");
        });
    });

    chart.draw();
}

function drawChart(elementId, add){
    add = typeof(add) != 'undefined' ? add : "";

    wrapperString = jQuery("#googlechartid_"+elementId+" .googlechart_configjson").attr('value');
    if (wrapperString.length > 0){
        wrapperJSON = JSON.parse(wrapperString);
        wrapperJSON.containerId = "googlechart_chart_div_" + elementId;

        dataTable=[];
        chartColumns_str = jQuery("#googlechartid_"+elementId+" .googlechart_columns").val();
        if (chartColumns_str === ""){
            chartColumns = [];
        }
        else{
            chartColumns = JSON.parse(chartColumns_str);
        }
        if (chartColumns.length > 0){
            columnlabels = [];
            jQuery(chartColumns).each(function(index,chart_token){
                columnlabels.push(available_columns[chart_token]);
            });
            dataTable.push(columnlabels);
            jQuery(merged_rows.items).each(function(index, merged_row){
                row = [];
                jQuery(chartColumns).each(function(index,chart_token){
                    row.push(merged_row[chart_token]);
                });
                dataTable.push(row);
            });
        }

        wrapperJSON.dataTable = dataTable;

        var wrapper = new google.visualization.ChartWrapper(wrapperJSON);
        wrapper.draw();
    }
}

function markAllChartsAsModified(){
    jQuery(".googlechart").each(function(){
        jQuery(this).addClass("googlechart_modified");
    });
}

function markChartAsModified(id){
    chartObj = jQuery("#googlechartid_"+id);
    chartObj.addClass("googlechart_modified");
}

function markChartAsThumb(id){
    jQuery(".googlechart_thumb_checkbox").each(function(){
        checkObj = jQuery(this);
        if (checkObj.attr("id") !== "googlechart_thumb_id_"+id){
            checkObj.attr("checked",false);
        }
        else {
            checkObj.attr("checked",true);
        }
    });
    markChartAsModified(id);
}

function addChart(id, name, config, columns, filters, width, height, filter_pos, options, isThumb){
    config = typeof(config) !== 'undefined' ? config : "";
    columns = typeof(columns) !== 'undefined' ? columns : "";
    filters = typeof(filters) !== 'undefined' ? filters : {};
    width = typeof(width) !== 'undefined' ? width : 800;
    height = typeof(height) !== 'undefined' ? height : 600;
    filter_pos = typeof(filter_pos) !== 'undefined' ? filter_pos : 0;
    options = typeof(options) !== 'undefined' ? options : "{}";
    isThumb = typeof(isThumb) !== 'undefined' ? isThumb : false;

    filter_pos = parseInt(filter_pos,0);
    shouldMark = false;
    if (config === ""){
        shouldMark = true;
        chart = defaultChart;
        chart.options.title = name;
        config = JSON.stringify(chart);
    }
    googlechart = "" +
        "<li class='googlechart daviz-facet-edit' id='googlechartid_"+id+"'>" +
            "<input class='googlechart_id' type='hidden' value='"+id+"'/>" +
            "<input class='googlechart_configjson' type='hidden' value='"+config+"'/>" +
            "<input class='googlechart_columns' type='hidden' value='"+columns+"'/>" +
            "<input class='googlechart_options' type='hidden' value='"+options+"'/>" +

            "<h1 class='googlechart_handle'>"+
            "<div style='float:left'>"+id+"</div>"+
            "<div class='ui-icon ui-icon-trash remove_chart_icon' title='Delete chart'>x</div>"+
            "<div style='float:right;font-weight:normal;font-size:0.9em;margin-right:10px'>Use this chart as thumb</div>"+
            "<input style='float:right; margin:3px' type='checkbox' class='googlechart_thumb_checkbox' id='googlechart_thumb_id_"+id+"' onChange='markChartAsThumb(\""+id+"\");' "+(isThumb?"checked='checked'":"")+"/>"+
            "<div style='clear:both'> </div>"+
            "</h1>" +
            "<fieldset>" +
            "<table>"+
                "<tr>"+
                    "<td>"+
                        "Friendly name:"+
                    "</td>"+
                    "<td>"+
                        "<input class='googlechart_name' type='text' value='"+name+"' style='width:100px' onchange='markChartAsModified(\""+id+"\");'/>" +
                    "</td>"+
                    "<td>"+
                        "Width: "+
                    "</td>"+
                    "<td>"+
                        "<input class='googlechart_width' type='text' value='"+width+"' style='width:100px' onchange='markChartAsModified(\""+id+"\");'/>" +
                    "</td>"+
                    "<td class='filters_position'>"+
                        "Filter position:"+
                        "<input type='radio' class='googlechart_filterposition' name='googlechart_filterposition_"+id+"' value='0' "+((filter_pos === 0)?"checked='checked'":"")+"' onchange='markChartAsModified(\""+id+"\");'/>Top" +
                        "<input type='radio' class='googlechart_filterposition' name='googlechart_filterposition_"+id+"' value='1' "+((filter_pos === 1)?"checked='checked'":"")+"' onchange='markChartAsModified(\""+id+"\");'/>Left" +
                        "<input type='radio' class='googlechart_filterposition' name='googlechart_filterposition_"+id+"' value='2' "+((filter_pos === 2)?"checked='checked'":"")+"' onchange='markChartAsModified(\""+id+"\");'/>Bottom" +
                        "<input type='radio' class='googlechart_filterposition' name='googlechart_filterposition_"+id+"' value='3' "+((filter_pos === 3)?"checked='checked'":"")+"' onchange='markChartAsModified(\""+id+"\");'/>Right" +
                    "</td>"+
                "</tr>"+
                "<tr>"+
                    "<td></td>"+
                    "<td></td>"+
                    "<td>"+
                        "Height:"+
                    "</td>"+
                    "<td>"+
                        "<input class='googlechart_height' type='text' value='"+height+"' style='width:100px' onchange='markChartAsModified(\""+id+"\");'/>" +
                    "</td>"+
                    "<td>"+
                    "</td>"+
                "</tr>"+
            "</table>"+
            "<div style='float:left'>" +
                "<div id='googlechart_chart_div_"+id+"' class='chart_div' style='max-height: 350px; max-width:500px; overflow:auto'></div>" +
            "</div>" +
            "<div style='float:right; width:180px'>" +
                "Filters" +
                "<span class='ui-icon ui-icon-plus ui-corner-all addgooglechartfilter' title='Add new filter'></span>" +
                "<ul class='googlechart_filters_list'  id='googlechart_filters_"+id+"'>" +
                "</ul>" +
            "</div>" +
            "<div style='clear:both'> </div>" +
            "<input type='button' class='context' value='Edit Columns' onclick='openEditColumns(\""+id+"\");'/>" +
            "<input type='button' class='context' value='Edit Chart' onclick='openEditor(\""+id+"\");'/>" +
            "<input type='button' class='context' value='Advanced Options' onclick='openAdvancedOptions(\""+id+"\");'/>" +
            "<a style='float:right' class='preview_button'>Preview Chart</a>"+
            "</fieldset>" +
        "</li>";

    jQuery(googlechart).appendTo("#googlecharts_list");

    jQuery("#googlechart_filters_"+id).sortable({
        handle : '.googlechart_filteritem_'+id,
        stop: function(event,ui){
            markChartAsModified(id);
        }
    });

    jQuery("#addgooglechartfilter_"+id).click(openAddDialog);

    drawChart(id);

    jQuery.each(filters,function(key,value){
        addFilter(id, key, value);
    });
    if (shouldMark){
        markChartAsModified(id);
    }
}

function openEditColumns(id){
    jQuery(".googlecharts_columns_config").remove();
    editcolumnsdialog =
    '<div class="googlecharts_columns_config">' +
        '<table border="0" class="ordered-selection-field">' +
            '<tr>' +
                '<td>' +
                    '<select id="googlecharts.columns.from" name="googlecharts.columns.from" class="googlecharts_columns_from" size="5" multiple="multiple">' +
                    '</select>' +
                '</td>' +
                '<td>' +
                    '<button name="from2toButton" type="button" value=" -&gt;" onclick="javascript:from2to(\'googlecharts.columns\')">&nbsp;-&gt;</button>' +
                    '<br />' +
                    '<button name="to2fromButton" type="button" value="&lt;- " onclick="javascript:to2from(\'googlecharts.columns\')">&lt;-&nbsp;</button>' +
                '</td>' +
                '<td>' +
                    '<select id="googlecharts.columns.to" name="googlecharts.columns.to" class="googlecharts_columns_to" size="5" multiple="multiple">' +
                    '</select>' +
                    '<input name="googlecharts.columns-empty-marker" type="hidden" />' +
                    '<span id="googlecharts.columns.toDataContainer">' +
                    '</span>' +
                '</td>' +
                '<td>' +
                    '<button name="upButton" type="button" value="^" onclick="javascript:moveUp(\'googlecharts.columns\')">^</button>' +
                    '<br />' +
                    '<button name="downButton" type="button" value="v" onclick="javascript:moveDown(\'googlecharts.columns\')">v</button>' +
                '</td>' +
            '</tr>' +
        '</table>' +
    '</div>';

    jQuery(editcolumnsdialog).dialog({title:"Edit Columns",
                modal:true,
                buttons:[
                    {
                        text: "Save",
                        click: function(){
                            selectedOptions = jQuery(".googlecharts_columns_to option");
                            columns=[];
                            selectedOptions.each(function(){
                                columns.push(jQuery(this).attr('value'));
                            });
                            columns_str = JSON.stringify(columns);
                            jQuery("#googlechartid_"+id+" .googlechart_columns").val(columns_str);
                            markChartAsModified(id);
                            jQuery(this).dialog("close");
                        }
                    },
                    {
                        text: "Cancel",
                        click: function(){
                            jQuery(this).dialog("close");
                        }
                    }
                ]});
    chartColumns_str = jQuery("#googlechartid_"+id+" .googlechart_columns").val();
    if (chartColumns_str === ""){
        chartColumns = [];
    }
    else{
        chartColumns = JSON.parse(chartColumns_str);
    }

    jQuery.each(available_columns,function(key,value){
        if (!chartColumns.find(key)){
            column = '<option value="'+key+'">'+value+'</option>';
            jQuery(column).appendTo(".googlecharts_columns_from");
        }
    });
    jQuery(chartColumns).each(function(index,key){
        if (available_columns[key]){
            column = '<option value="'+key+'">'+available_columns[key]+'</option>';
            jQuery(column).appendTo(".googlecharts_columns_to");
        }
    });
}

function redrawChart(){
    jsonString = chartEditor.getChartWrapper().toJSON();
    chartObj = jQuery("#googlechartid_"+chartId);
    chartObj.find(".googlechart_configjson").attr('value',jsonString);
    chartObj.find(".googlechart_name").attr('value',chartEditor.getChartWrapper().getOption('title'));
    chartEditor.getChartWrapper().draw(jQuery("#googlechart_chart_div_"+chartId)[0]);
    markChartAsModified(chartId);
}

function openEditor(elementId) {
    chartId = elementId;
    chartObj = jQuery("#googlechartid_"+elementId);
    title = chartObj.find(".googlechart_name").attr("value");

    wrapperString = chartObj.find(".googlechart_configjson").attr('value');
    if (wrapperString.length > 0){
        wrapperJSON = JSON.parse(wrapperString);
        chart = wrapperJSON;
    }
    else{
        chart = defaultChart;
    }

    dataTable=[];
    chartColumns_str = jQuery("#googlechartid_"+elementId+" .googlechart_columns").val();
    if (chartColumns_str === ""){
        chartColumns = [];
    }
    else{
        chartColumns = JSON.parse(chartColumns_str);
    }
    if (chartColumns.length > 0){
        columnlabels = [];
        jQuery(chartColumns).each(function(index,chart_token){
            columnlabels.push(available_columns[chart_token]);
        });
        dataTable = [];
        dataTable.push(columnlabels);
        jQuery(merged_rows.items).each(function(index, merged_row){
            row = [];
            jQuery(chartColumns).each(function(index,chart_token){
                row.push(merged_row[chart_token]);
            });
            dataTable.push(row);
        });
    }

    chart.dataTable = dataTable;

    chart.options.title = title;
    var wrapper = new google.visualization.ChartWrapper(chart);

    chartEditor = new google.visualization.ChartEditor();
    google.visualization.events.addListener(chartEditor, 'ok', redrawChart);
    chartEditor.openDialog(wrapper, {});
}

function openAddChartFilterDialog(id){
    jQuery(".googlecharts_filter_config").remove();


    addfilterdialog = '' +
    '<div class="googlecharts_filter_config">' +
        '<div class="field">' +
            '<label>Column</label>' +
            '<span class="required" style="color: #f00;" title="Required"> ■ </span>' +
            '<div class="formHelp">Filter Column</div>' +
            '<select class="googlecharts_filter_columns">' +
                '<option value="-1">Select Column</option>'+
            '</select>' +
        '</div>' +
        '<div class="field">' +
            '<label>Type</label>' +
            '<span class="required" style="color: #f00;" title="Required"> ■ </span>' +
            '<div class="formHelp">Filter Type</div>' +
            '<select class="googlecharts_filter_type">' +
                '<option value="-1">Select Filter Type</option>'+
            '</select>' +
        '</div>' +
    '</div>';

    jQuery(addfilterdialog).dialog({title:"Add Filter",
                modal:true,
                buttons:[
                    {
                        text: "Save",
                        click: function(){
                            selectedColumn = jQuery(".googlecharts_filter_columns").val();
                            selectedFilter = jQuery(".googlecharts_filter_type").val();
                            if ((selectedColumn === '-1') || (selectedFilter === '-1')){
                                alert ("Please select column and filter type!");
                            }
                            else{
                                addFilter(id, selectedColumn,selectedFilter);
                                markChartAsModified(id);
                                jQuery(this).dialog("close");
                            }
                        }
                    },
                    {
                        text: "Cancel",
                        click: function(){
                            jQuery(this).dialog("close");
                        }
                    }
                ]});


    var orderedFilter = jQuery("#googlechart_filters_"+id).sortable('toArray');
    used_columns = [];

    jQuery(orderedFilter).each(function(index,value){
            used_columns.push(jQuery("#"+value+" .googlechart_filteritem_column").attr("value"));
    });

    chartColumns_str = jQuery("#googlechartid_"+id+" .googlechart_columns").val();
    if (chartColumns_str === ""){
        chartColumns = [];
    }
    else{
        chartColumns = JSON.parse(chartColumns_str);
    }

    jQuery.each(available_columns,function(key,value){
        if (!used_columns.find(key)){
            if (chartColumns.find(key)){
                column = '<option value="'+key+'">'+value+'</option>';
                jQuery(column).appendTo(".googlecharts_filter_columns");
            }
        }
    });

    jQuery.each(available_filter_types,function(key,value){
        column = '<option value="'+key+'">'+value+'</option>';
        jQuery(column).appendTo(".googlecharts_filter_type");
    });

}

function removeChart(id){
    jQuery("#"+id).remove();
    markAllChartsAsModified();
}

function saveCharts(){
    DavizEdit.Status.start("Saving Charts");
    var ordered = jQuery('#googlecharts_list').sortable('toArray');
    var jsonObj = {};
    charts = [];
    var thumbId;
    jQuery(ordered).each(function(index, value){
        var chartObj = jQuery("#"+value);
        chartObj.removeClass("googlechart_modified");
        var chart = {};
        chart.id = chartObj.find(".googlechart_id").attr("value");
        chart.name = chartObj.find(".googlechart_name").attr("value");
        chart.config = chartObj.find(".googlechart_configjson").attr("value");
        chart.width = chartObj.find(".googlechart_width").attr("value");
        chart.height = chartObj.find(".googlechart_height").attr("value");
        chart.filterposition = chartObj.find(".googlechart_filterposition:checked").attr("value");
        chart.options = chartObj.find(".googlechart_options").attr("value");
        chart.isThumb = chartObj.find(".googlechart_thumb_checkbox").attr("checked");
        config = JSON.parse(chart.config);
        config.options.title = chart.name;
        config.dataTable = [];
        chart.config = JSON.stringify(config);
        chart.columns = chartObj.find(".googlechart_columns").attr("value");
        id = "googlechart_filters_"+chart.id;
        var orderedFilter = jQuery("#googlechart_filters_"+chart.id).sortable('toArray');
        filters = {};

        jQuery(orderedFilter).each(function(index,filter){
            filters[jQuery("#"+filter+" .googlechart_filteritem_column").attr("value")] = jQuery("#"+filter+" .googlechart_filteritem_type").attr("value");
        });
        chart.filters = JSON.stringify(filters);
        charts.push(chart);
        if ((index == 0) || (chart.isThumb)){
            thumbId = chart.id;
        }

    });
    jsonObj.charts = charts;
    jsonStr = JSON.stringify(jsonObj);
    query = {'charts':jsonStr};
    jQuery.ajax({
        url:ajax_baseurl+"/googlechart.submit_charts",
        type:'post',
        data:query,
        success:function(data){
            chartSettings=[];
            chartObj = jQuery("#googlechartid_"+thumbId);
            chartSettings[0] = thumbId;
            chartSettings[1] = JSON.parse(chartObj.find(".googlechart_configjson").attr("value"));
            chartSettings[2] = JSON.parse(chartObj.find(".googlechart_columns").attr("value"));
            chartSettings[3] = "";
            chartSettings[4] = chartObj.find(".googlechart_width").attr("value");
            chartSettings[5] = chartObj.find(".googlechart_height").attr("value");
            chartSettings[6] = "";
            chartSettings[7] = JSON.parse(chartObj.find(".googlechart_options").attr("value"));

            DavizEdit.Status.stop(data);

            saveThumb(chartSettings);
        }
    });
}

function loadCharts(){
    DavizEdit.Status.start("Loading Charts");
    jQuery.ajax({
        url:ajax_baseurl+"/googlechart.get_charts",
        type:'post',
        success:function(data){
            if (data){
                jsonObj = JSON.parse(data);
                charts = jsonObj.charts;
                jQuery(charts).each(function(index,chart){
                    addChart(chart.id,chart.name,chart.config,chart.columns,JSON.parse(chart.filters), chart.width, chart.height, chart.filterposition, chart.options, chart.isThumb);
                });
            }
            DavizEdit.Status.stop("Done");
        }
    });
}

function init_googlecharts_edit(){
    jQuery("#googlecharts_list").sortable({
        handle : '.googlechart_handle',
        stop: function(event,ui){
            draggedItem = jQuery(ui.item[0]).attr('id');
            liName = "googlechartid";
            if (draggedItem.substr(0,liName.length) == liName){
                id = draggedItem.substr(liName.length+1);
                drawChart(id);
                markChartAsModified(id);
            }
        }
    });

    jQuery("#addgooglechart").click(openAddDialog);
    jQuery("#googlecharts_list").delegate(".remove_chart_icon","click",function(){
        removeChart(jQuery(this).closest('.googlechart').attr('id'));
    });

    jQuery("#googlecharts_list").delegate(".remove_filter_icon","click",function(){
        chartId = jQuery(this).closest('.googlechart').attr('id');
        liName = "googlechartid";
        id = chartId.substr(liName.length+1);
        markChartAsModified(id);
        jQuery(this).closest('.googlechart_filteritem').remove();
    });

    jQuery("#googlecharts_list").delegate(".addgooglechartfilter","click",function(){
        chartId = jQuery(this).closest('.googlechart').attr('id');
        liName = "googlechartid";
        id = chartId.substr(liName.length+1);
        openAddChartFilterDialog(id);
    });

    jQuery('#googlecharts_submit').click(function(e){
        saveCharts();
    });

    jQuery("#googlecharts_list").delegate("a.preview_button", "hover", function(){
        chartObj = jQuery(this).closest('.googlechart');
        width = chartObj.find(".googlechart_width").attr("value");
        height = chartObj.find(".googlechart_height").attr("value");
        name = chartObj.find(".googlechart_name").attr("value");
        params = "?json="+encodeURIComponent(chartObj.find(".googlechart_configjson").attr("value"));
        params += "&options="+encodeURIComponent(chartObj.find(".googlechart_options").attr("value"));
        params += "&columns="+encodeURIComponent(chartObj.find(".googlechart_columns").attr("value"));
        params += "&width="+width;
        params += "&height="+height;
        params += "&name="+encodeURIComponent(name);
        jQuery(this).attr("href", "chart-full"+params);
        jQuery(this).fancybox({type:'iframe', width:parseInt(width, 10), height:parseInt(height, 10), autoDimensions:false});
    });

    loadCharts();
}

jQuery(document).ready(function($){
    jQuery(document).bind(DavizEdit.Events.views.refreshed, function(evt, data){
        location.reload();
    });
});
