/**
 * Created by Jonathan on 3/12/2017.
 */
import { PritchardAirfoil, default_pritchard_params } from './pritchard_airfoil';

Template.public_airfoils.helpers({
    airfoils: function() {
        return Airfoils.find({private: {$ne: true}});
    }
});

Template.public_airfoils.onRendered(function() {
    $(window).resize(function(evt) {
        // console.log('Need to fix resizing for svg.')
        //todo: Need to check to make sure we are on design page....
        if (Session.get(CURRENT_PAGE_KEY) == PUBLIC_PAGE_KEY){
            console.log('To do some work here to figure out how to scale.')
        }
    });

    var airfoil_row = d3.select('#public_airfoil_row');

    Deps.autorun(function() {
        var airfoils = Airfoils.find({private: {$ne: true}}).fetch();
        if (airfoils.length == 0){
            return;
        }

        var airfoil_list = [];
        for (i=0; i < airfoils.length; i++){
            airfoil_list.push(airfoils[i]);
        }

        var airfoil_data = airfoil_row.selectAll('div.airfoil_svg')
            .data(airfoil_list, function(d, i){
                return d._id;
            });

        airfoil_data.select('p').text(function(d){
            console.log(d.name);
            return d.name;
        });

        var airfoil_divs = airfoil_data.enter()
            .append('div')
            .attr('class', 'col-md-3 airfoil_svg')
            .append('a')
            .attr('href', function(d){
                console.log('/design/' + d._id);
                return '/design/' + d._id;
            })
            .append('button')
            .attr('class', 'btn btn-default');

        airfoil_divs.append('svg')
            .attr('id', function(d) {
                return 'Airfoil_' + d._id;
            })
            .attr('class', 'airfoil_svg')
            .attr('width', '100%');

        airfoil_divs
            .append('p').text(function(d){
                console.log(d.name);
                return d.name;
            });

        airfoil_data.exit()
            .remove();

        airfoil_row.selectAll('svg.airfoil_svg')
            .each(function (d) {update_airfoil(d);});
    });

});

function update_airfoil(airfoil_obj){
    console.log('Updating ' + airfoil_obj.name);

    var svg_obj = d3.select('svg#Airfoil_' + airfoil_obj._id);
    if (!svg_obj){
        return;
    }

    var p_airfoil = new PritchardAirfoil(airfoil_obj.parameters);

    var svg_width = $('#' + svg_obj.attr('id'))[0].getBoundingClientRect().width;
    var svg_height = svg_width;
    svg_obj.attr('height', svg_height);

    // Set up scales
    var min_x, min_y,max_x, max_y, ss_ys;
    min_x = 0.0;
    max_x = p_airfoil.cx + p_airfoil.rte;
    min_y = -p_airfoil.rte;
    ss_ys = [];
    for (i=0; i < p_airfoil.ss_pts.length; i++){
        ss_ys.push(p_airfoil.ss_pts[i].y);
    }
    max_y = d3.max(ss_ys);

    var x_dist, y_dist, mid_point;
    x_dist = max_x - min_x;
    y_dist = max_y - min_y;
    mid_point = [x_dist/2.0, y_dist/2.0];

    var chosen_length;
    if (x_dist >= y_dist){
        chosen_length = x_dist;
    } else {
        chosen_length = y_dist;
    }

    // Recal min & max using +- from mid_point and chosen length
    min_x = mid_point[0] - chosen_length/1.5;
    max_x = mid_point[0] + chosen_length/1.5;
    min_y = mid_point[1] - chosen_length/1.5;
    max_y = mid_point[1] + chosen_length/1.5;

    var x_scale = d3.scale.linear()
        .domain([min_x, max_x])
        .range([0, svg_width]);
    var y_scale = d3.scale.linear()
        .domain([min_y, max_y])
        .range([svg_height, 0]);

    var line = d3.svg.line()
        .interpolate('linear')
        .x(function(d) {
            return x_scale(d.x);
        })
        .y(function(d) {
            return y_scale(d.y);
        });

    // Create Leading Edge
    svg_obj.selectAll('path.le_line')
        .data([p_airfoil.le_pts])
        .attr('d', function(d) {return line(d)})
        .enter()
        .append('path')
        .attr('class','le_line')
        .attr('d', function(d) {return line(d)})
        .attr("stroke", "blue")
        .attr("stroke-width", 1.0)
        .attr("fill", "none");

    // Draw Trailing Edge
    svg_obj.selectAll('path.te_line')
        .data([p_airfoil.te_pts])
        .attr('d', function(d) {return line(d)})
        .enter()
        .append('path')
        .attr('class','te_line')
        .attr('d', function(d) {return line(d)})
        .attr("stroke", "blue")
        .attr("stroke-width", 1.0)
        .attr("fill", "none");

    // Draw SS
    svg_obj.selectAll('path.ss_line')
        .data([p_airfoil.ss_pts])
        .attr('d', function(d) {return line(d)})
        .enter()
        .append('path')
        .attr('class','ss_line')
        .attr('d', function(d) {return line(d)})
        .attr("stroke", "blue")
        .attr("stroke-width", 1.0)
        .attr("fill", "none");

    // Draw THRT
    svg_obj.selectAll('path.thrt_line')
        .data([p_airfoil.thrt_pts])
        .attr('d', function(d) {return line(d)})
        .enter()
        .append('path')
        .attr('class','thrt_line')
        .attr('d', function(d) {return line(d)})
        .attr("stroke", "blue")
        .attr("stroke-width", 1.0)
        .attr("fill", "none");

    // Draw PS
    svg_obj.selectAll('path.ps_line')
        .data([p_airfoil.ps_pts])
        .attr('d', function(d) {return line(d)})
        .enter()
        .append('path')
        .attr('class','ps_line')
        .attr('d', function(d) {return line(d)})
        .attr("stroke", "blue")
        .attr("stroke-width", 1.0)
        .attr("fill", "none");

};