import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { PritchardAirfoil, default_pritchard_params } from './pritchard_airfoil';
import './main.html';

var p_airfoil = new PritchardAirfoil(default_pritchard_params);

var points = [{x: 10, y: 50}, {x: 10, y: 10}, {x: 100, y: 10}, {x: 180, y: 190}, {x: 50, y: 50}];

Template.hello.onCreated(function helloOnCreated() {
    // counter starts at 0
    this.counter = new ReactiveVar(0);
});

Template.hello.helpers({
    counter() {
        return Template.instance().counter.get();
    },
});

Template.hello.events({
    'click button'(event, instance) {
        // increment the counter when button is clicked
        instance.counter.set(instance.counter.get() + 1);
        console.log(p_airfoil.toString());
    },
});

Template.airfoil_section_svg.rendered = function sectionOnCreated() {

    var lut = [
        [1]
    ];

    var binomial = function(n) {
        var s, nextRow, prev;
        while (n >= lut.length){
            nextRow = [];
            nextRow.push(1);
            prev = lut.length-1;
            for (i=1; i <= prev; i++){
                nextRow.push(lut[prev][i-1] + lut[prev][i]);
            }
            nextRow.push(1);
            lut.push(nextRow);
        }
        return lut[n];
    };

    console.log(binomial(6));
    console.log(lut);

    var var_func = function(ws, t){
        var x_val = 0;
        var n = ws.length;
        var bin = binomial(n);
        for (i=0; i < n; i++){
            // if (t == 0){
            //     console.log(ws[i])
            //     console.log(bin[i])
            //     console.log(Math.pow(1-t,n-i))
            //     console.log(Math.pow(t,i))
            //     console.log('sum=' + ws[i]*bin[i]*Math.pow(1-t,n-i)*Math.pow(t,i))
            // }
            x_val += ws[i]*bin[i]*Math.pow(1-t,n-i)*Math.pow(t,i);
        }
        return x_val;
    };

    var width = 800;
    var height = 600;
    var point_radius = 10
    var dragging = false;

    // Variables to keep track of the current scale factor and translation when zooming/panning.
    var current_scale = 1.0
    var current_translate = [0, 0];
    // Variables to keep track of current x & y viewable areas
    // We'll use the scale and translate above later to manipulate these to know exactly what is showing.
    var x_constraints = [0, width];
    var y_constraints = [0, height];

    var svg = d3.select('#airfoil_section');
    svg.attr('width', width);
    svg.attr('height', height);

    var bg_rect = svg.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', 'gray')

    var zoom_group = svg.append('g');

    bg_rect.call(d3.behavior.zoom().on("zoom", function () {
            current_translate = d3.event.translate;
            current_scale = d3.event.scale;

            zoom_group.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")")

            x_constraints = [-current_translate[0]/current_scale, (width-current_translate[0])/current_scale]
            y_constraints = [-current_translate[1]/current_scale, (height-current_translate[1])/current_scale]
    }));

    // svg.selectAll('circle').attr('fill','red');
    var num_points = 50;
    var ts = []
    for (i=0; i<num_points; i++){
        ts.push(i*(1.0/(num_points-1)));
    }

    var line = d3.svg.line()
        .interpolate('linear')
        .x(function(d) {
                var ws = [];
                for (i = 0; i < points.length; i++) {
                    ws.push(points[i].x);
                }
                return var_func(ws, d);
            })
        .y(function(d) {
            var ws = [];
            for (i = 0; i < points.length; i++) {
                ws.push(points[i].y);
            }
            return var_func(ws, d);
        });

    // line = d3.svg.line()
    //     .x(function(d){return d.x})
    //     .y(function(d){return d.y})
    //     .interpolate('linear');

    zoom_group.selectAll('path.line')
        .data([ts])
        .enter()
        .append('path')
        .attr('class','line')
        .attr('d', function(d) {return line(d)})
        .attr("stroke", "blue")
        .attr("stroke-width", 2)
        .attr("fill", "none");

    // svg.selectAll('path.line')
    //     .data([points])
    //     .attr('d', function(d){
    //         return line(d);
    //     });

    drag_point = d3.behavior.drag()
        .on('dragstart', function(d) {
            this.parentNode.appendChild(this);
        })
        .on('drag', function(d, i) {
            var e, x, y;
            // console.log(i);
            e = d3.event
            x = d.x + e.dx;
            y = d.y + e.dy;

            if (x - point_radius >= x_constraints[0] && x + point_radius <= x_constraints[1]
                && y - point_radius >= y_constraints[0] && y + point_radius <= y_constraints[1]) {
                // change cx, cy only after we know it's within
                // bounds...this gives smoother movement around the
                // boundaries
                cx = x, cy=y;
                d.x = x;
                d.y = y;
                points[i].x = x;
                points[i].y = y;
                d3.select(this).attr({cx: cx, cy: cy});

                zoom_group.selectAll('path.line')
                    .data([ts])
                    .attr('class','line')
                    .attr('d', function(d) {return line(d)});
            }
        })

    var circ = zoom_group.selectAll('circle.points')
        .data(points)
        .enter().append('circle')
        .attr('class', 'points')
        .attr('r', point_radius)
        .attr('cx', function(d) {return d.x})
        .attr('cy', function(d) {return d.y})
        .attr('fill', 'green')
        .call(drag_point);

};

Template.zoom_test.rendered = function sectionOnCreated() {

    var width = 500;
    var height = 500;

    var svg = d3.select('#zoom_test');
    svg.attr('width', width);
    svg.attr('height', height);


    var svg = svg.call(d3.behavior.zoom().on("zoom", function () {
            svg.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")")
        }))
        .append("g")

    svg.append("circle")
        .attr("cx", width / 2)
        .attr("cy", height / 2)
        .attr("r", 50)
        .style("fill", "blue")
};