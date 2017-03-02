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

            // console.log('zoom.')
            // console.log(current_translate);
            // console.log(current_scale);
            // console.log(x_constraints);
            // console.log(y_constraints);
    }));

    // svg.selectAll('rect.background_rect')
    //     .attr('width', width)
    //     .attr('height', height);


    // svg.selectAll('circle').attr('fill','red');

    drag_point = d3.behavior.drag()
        .on('dragstart', function(d) {
            this.parentNode.appendChild(this);
        })
        .on('drag', function(d) {
            var e, x, y;

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
                d3.select(this).attr({cx: cx, cy: cy});
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