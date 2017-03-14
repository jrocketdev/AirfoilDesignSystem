import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { PritchardAirfoil, default_pritchard_params } from './pritchard_airfoil';
import './design_page.html';

// Set up local variables to keep track of.
var airfoil_id = DEFAULT_AIRFOIL_KEY;
var p_airfoil = new PritchardAirfoil(default_pritchard_params);

// SVG Information & Variables
var svg_width = 0;
var svg_height = 0;
var svg_h_to_w_ratio = 0.75;
var svg;
var bg_rect;
var zoom_group;
var x_scale;
var y_scale;
var line;
var duplicate_line;
var cntrl_pt_radius = 3;
var current_scale = 1.0;
var current_translate = [0, 0];
var x_constraints;
var y_constraints;

Template.design_page.events({
    'change #r_input'(event, instance){
        p_airfoil.r = Number(event.target.value);
        p_airfoil.calc_airfoil();

        draw_airfoil();
    },
    'change #cx_input'(event, instance){
        p_airfoil.cx = Number(event.target.value);
        p_airfoil.calc_airfoil();

        draw_airfoil();
    },
    'change #ct_input'(event, instance){
        p_airfoil.ct = Number(event.target.value);
        p_airfoil.calc_airfoil();

        draw_airfoil();
    },
    'change #uct_input'(event, instance){
        p_airfoil.uct = Number(event.target.value)*Math.PI/180.0;
        p_airfoil.calc_airfoil();

        draw_airfoil();
    },
    'change #b1_input'(event, instance){
        p_airfoil.b1 = Number(event.target.value)*Math.PI/180.0;
        p_airfoil.calc_airfoil();

        draw_airfoil();
    },
    'change #db1_input'(event, instance){
        p_airfoil.db1 = Number(event.target.value)*Math.PI/180.0;
        p_airfoil.calc_airfoil();

        draw_airfoil();
    },
    'change #rle_input'(event, instance){
        p_airfoil.rle = Number(event.target.value);
        p_airfoil.calc_airfoil();

        draw_airfoil();
    },
    'change #b2_input'(event, instance){
        p_airfoil.b2 = Number(event.target.value)*Math.PI/180.0;
        p_airfoil.calc_airfoil();

        draw_airfoil();
    },
    'change #rte_input'(event, instance){
        p_airfoil.rte = Number(event.target.value);
        p_airfoil.calc_airfoil();

        draw_airfoil();
    },
    'change #nb_input'(event, instance){
        p_airfoil.nb = Number(event.target.value);
        p_airfoil.calc_airfoil();

        draw_airfoil();
    },
    'change #o_input'(event, instance){
        p_airfoil.o = Number(event.target.value);
        p_airfoil.calc_airfoil();

        draw_airfoil();
    }
});

Template.airfoil_svg_section.rendered = function sectionOnCreated() {
    $(window).resize(function(evt) {
        // console.log('Need to fix resizing for svg.')
        //todo: Need to check to make sure we are on design page....
        if (Session.get(CURRENT_PAGE_KEY) == DESIGN_PAGE_KEY){
            if (svg_width != $('#airfoil_section')[0].getBoundingClientRect().width){
                // console.log('Resizing...');
                svg_width = $('#airfoil_section')[0].getBoundingClientRect().width;
                svg_height = svg_width*0.8;
                svg.attr('height', svg_width*0.8);
                bg_rect.attr('width', svg_width)
                    .attr('height', svg_height)
                determine_scales();
                draw_airfoil();
            }
        }
    });

    // Update the airfoil to the new one.
    update_airfoil_id();

    render_svg();

    // Set the airfoil page key now that it is rendered.
    Session.set(CURRENT_PAGE_KEY, DESIGN_PAGE_KEY);
};

Template.design_toolbar.helpers({
    name: function(){
        return Session.get(AIRFOIL_NAME_KEY);
    },
    canEdit: function(){
        // If the user isn't logged in. They can't edit anything
        if (!Meteor.user()){
            console.log('Not logged in.');
            return false;
        }

        // If this is the default airfoil... they can edit. Otherwise they need to be the owner.
        if (Session.get(AIRFOIL_KEY) == DEFAULT_AIRFOIL_KEY){
            return true;
        }
        // It's not the default airfoil. They can only edit if they own it.
        if (Session.get(AIRFOIL_CREATOR) == Meteor.userId()){
            return true;
        }

        return false;
    },
    privateText: function() {
        if (Session.get(IS_PRIVATE_KEY)){
            return "Private";
        } else {
            return "Public";
        }
    }
});

Template.design_toolbar.events({
    'click .js-save-airfoil' (event, instance){
        // Update the airfoil params with what is currently showed on Screen.

        if (Session.get(AIRFOIL_KEY) == DEFAULT_AIRFOIL_KEY){
            // THis was the default airfoil... which means we need to add a new one into the db.
            var airfoil_obj = {
                name: Session.get(AIRFOIL_NAME_KEY),
                private: Session.get(IS_PRIVATE_KEY),
                creator: Session.get(AIRFOIL_CREATOR),
                parameters: p_airfoil.get_params()
            };
            console.log('Adding new airfoil to the DB for the current user.');
            Meteor.call('addAirfoil', airfoil_obj, function(err, result){
                console.log(result);
                if (result){
                    // We have a valid airfoil. Update session variable.
                    Session.set(AIRFOIL_KEY, result);
                }
            });
        } else {
            var airfoil_obj = {
                name: Session.get(AIRFOIL_NAME_KEY),
                private: Session.get(IS_PRIVATE_KEY),
                creator: Session.get(AIRFOIL_CREATOR),
                parameters: p_airfoil.get_params(),
                _id: Session.get(AIRFOIL_KEY)
            };
            Meteor.call('updateAirfoil', airfoil_obj, function(err, result){
                console.log(result);
            });
            console.log('This airfoil already exists... updating it.');
        }
    },
    'click .js-edit-name' (event, instance){
        var new_name = $('#airfoil_name_edit').val();
        Session.set(AIRFOIL_NAME_KEY, new_name);
    },
    'click .js-update-privacy' (event, instance){
        Session.set(IS_PRIVATE_KEY, !Session.get(IS_PRIVATE_KEY));
    }
});

Tracker.autorun(function() {
    // console.log('TRACKER TRIGGERED', Session.get(AIRFOIL_KEY) );
    if (Session.get(AIRFOIL_KEY) != airfoil_id){
        update_airfoil_id();
    }
});

function render_svg() {
    // Set the initial value for duplicating airfoil.
    Session.set(DUPLICATE_KEY, true);

    // Populate the airfoil parameters in the sidebar list.
    populate_airfoil_params();

    // Set the SVG width and height variables
    svg_width = $('#airfoil_section')[0].getBoundingClientRect().width;
    svg_height = svg_width*svg_h_to_w_ratio;
    // console.log(svg_width, svg_height);

    // Variables to keep track of the current scale factor and translation when zooming/panning.
    // Variables to keep track of current x & y viewable areas
    // We'll use the scale and translate above later to manipulate these to know exactly what is showing.
    x_constraints = [0, svg_width];
    y_constraints = [0, svg_height];

    // Set up the SVG area with width and height
    svg = d3.select('#airfoil_section');
    // svg.attr('width', svg_width);
    svg.attr('height', svg_height);

    // Set up background SVG
    bg_rect = svg.append('rect')
        .attr('width', svg_width)
        .attr('height', svg_height)
        .attr('fill', 'silver')
        .attr('class', 'background');

    // Append a group to the SVG
    // This group will be used to zoom in/out
    zoom_group = svg.append('g')
        .attr('class', 'zoom_group');

    // Set up zoom behavior.
    // Listen for the zoom event on the background, then apply it to the zoom_group (all airfoil info)
    bg_rect.call(d3.behavior.zoom().on("zoom", function () {
        current_translate = d3.event.translate;
        current_scale = d3.event.scale;


        zoom_group.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")");
        // bg_rect.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")");

        x_constraints = [-current_translate[0]/current_scale, (svg_width-current_translate[0])/current_scale]
        y_constraints = [-current_translate[1]/current_scale, (svg_height-current_translate[1])/current_scale]
    }));

    // Create X and Y scales
    determine_scales();

    // Create the line to do the paths around the airfoil.
    line = d3.svg.line()
        .interpolate('linear')
        .x(function(d) {
            return x_scale(d.x);
        })
        .y(function(d) {
            return y_scale(d.y);
        });

    duplicate_line = d3.svg.line()
        .interpolate('linear')
        .x(function(d) {
            return x_scale(d.x);
        })
        .y(function(d) {
            return y_scale(d.y + p_airfoil.r*(2*Math.PI/p_airfoil.nb));
        });

    // Draw the airfoil
    draw_airfoil();
}

function update_airfoil_id() {
    airfoil_id = Session.get(AIRFOIL_KEY);
    if (airfoil_id == DEFAULT_AIRFOIL_KEY) {
        p_airfoil = new PritchardAirfoil(default_pritchard_params);
        Session.set(AIRFOIL_NAME_KEY, 'Default Airfoil');
        Session.set(IS_PRIVATE_KEY, false);
        Session.set(AIRFOIL_CREATOR, 'admin');
    } else {
        var temp_airfoil = Airfoils.findOne({_id: airfoil_id});
        if (temp_airfoil){
            p_airfoil = new PritchardAirfoil(temp_airfoil.parameters);
            Session.set(AIRFOIL_NAME_KEY, temp_airfoil.name);
            Session.set(IS_PRIVATE_KEY, temp_airfoil.private);
            Session.set(AIRFOIL_CREATOR, temp_airfoil.creator);
        }
    }

    if (Session.get(CURRENT_PAGE_KEY) == DESIGN_PAGE_KEY) {
        console.log('Rendered and going!');
        render_svg();
        populate_airfoil_params();
        draw_airfoil();
    }

    console.log(Session.get(AIRFOIL_NAME_KEY));
    console.log(Session.get(IS_PRIVATE_KEY));
    console.log(Session.get(AIRFOIL_CREATOR));
}

function determine_scales(){
    // Determine max and mins
    var min_x, min_y,max_x, max_y, ss_ys;
    min_x = 0.0;
    max_x = p_airfoil.cx + p_airfoil.rte;
    min_y = -p_airfoil.rte;
    ss_ys = []
    for (i=0; i < p_airfoil.ss_pts.length; i++){
        ss_ys.push(p_airfoil.ss_pts[i].y);
    }
    max_y = d3.max(ss_ys);
    // console.log(min_x, max_x, min_y, max_y);
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

    // Set the scales
    x_scale = d3.scale.linear()
        .domain([min_x, max_x])
        .range([0, svg_width*svg_h_to_w_ratio]);
    y_scale = d3.scale.linear()
        .domain([min_y, max_y])
        .range([svg_height, 0]);

    // x_scale = d3.scale.linear()
    //     .domain(p_airfoil.get_extents())
    //     .range([0, svg_width*svg_ratio]);
    // y_scale = d3.scale.linear()
    //     .domain(p_airfoil.get_extents())
    //     .range([svg_height, 0]);
}

function point_at_angle_dist(pt, ang, dist){
    return {x: pt.x + dist*Math.cos(ang), y: pt.y + dist*Math.sin(ang)};
}

function round(value, decimals) {
    return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}

function populate_airfoil_params(){
    $('#r_input').val(p_airfoil.r);
    $('#cx_input').val(round(p_airfoil.cx, 4));
    $('#ct_input').val(round(p_airfoil.ct, 4));
    $('#uct_input').val(round(p_airfoil.uct*180.0/Math.PI, 3));
    $('#b1_input').val(round(p_airfoil.b1*180.0/Math.PI, 3));
    $('#db1_input').val(p_airfoil.db1*180.0/Math.PI);
    $('#rle_input').val(p_airfoil.rle);
    $('#b2_input').val(round(p_airfoil.b2*180.0/Math.PI, 3));
    $('#rte_input').val(p_airfoil.rte);
    $('#nb_input').val(p_airfoil.nb);
    $('#o_input').val(round(p_airfoil.o, 4));

}

function draw_duplicate_airfoil() {
    zoom_group.selectAll('path.duplicate_line')
        .data([p_airfoil.le_pts, p_airfoil.te_pts, p_airfoil.ss_pts, p_airfoil.ps_pts, p_airfoil.thrt_pts])
        .attr('d', function(d) {return duplicate_line(d)})
        .enter()
        .append('path')
        .attr('class','duplicate_line')
        .attr('d', function(d) {return duplicate_line(d)})
        .attr("stroke", "#0066ff")
        .attr("stroke-width", 1.0)
        .attr("fill", "none");
}

function draw_airfoil(){
    redraw_le();
    redraw_te();
    redraw_ss();
    redraw_ps();
    redraw_thrt();

    draw_refpoints();

    if (Session.get(DUPLICATE_KEY)) {
        draw_duplicate_airfoil();
    }

    draw_control();
}

function draw_refpoints(){
    zoom_group.selectAll('circle.ref_points')
        .data([p_airfoil.pt1, p_airfoil.pt2, p_airfoil.pt3, p_airfoil.pt4, p_airfoil.pt5])
        .attr('r', 2)
        .attr('cx', function(d) {return x_scale(d.x)})
        .attr('cy', function(d) {return y_scale(d.y)})
        .attr('fill', 'blue')
        .enter().append('circle')
        .attr('class', 'ref_points')
        .attr('r', 2)
        .attr('cx', function(d) {return x_scale(d.x)})
        .attr('cy', function(d) {return y_scale(d.y)})
        .attr('fill', 'blue');
}

function redraw_le(){
    zoom_group.selectAll('path.le_line')
        .data([p_airfoil.le_pts])
        .attr('d', function(d) {return line(d)})
        .enter()
        .append('path')
        .attr('class','le_line')
        .attr('d', function(d) {return line(d)})
        .attr("stroke", "blue")
        .attr("stroke-width", 1.0)
        .attr("fill", "none");
}

function redraw_te(){
    zoom_group.selectAll('path.te_line')
        .data([p_airfoil.te_pts])
        .attr('d', function(d) {return line(d)})
        .enter()
        .append('path')
        .attr('class','te_line')
        .attr('d', function(d) {return line(d)})
        .attr("stroke", "blue")
        .attr("stroke-width", 1.0)
        .attr("fill", "none");
}

function redraw_ss(){
    zoom_group.selectAll('path.ss_line')
        .data([p_airfoil.ss_pts])
        .attr('d', function(d) {return line(d)})
        .enter()
        .append('path')
        .attr('class','ss_line')
        .attr('d', function(d) {return line(d)})
        .attr("stroke", "blue")
        .attr("stroke-width", 1.0)
        .attr("fill", "none");
}

function redraw_thrt(){
    zoom_group.selectAll('path.thrt_line')
        .data([p_airfoil.thrt_pts])
        .attr('d', function(d) {return line(d)})
        .enter()
        .append('path')
        .attr('class','thrt_line')
        .attr('d', function(d) {return line(d)})
        .attr("stroke", "blue")
        .attr("stroke-width", 1.0)
        .attr("fill", "none");
}

function redraw_ps(){
    zoom_group.selectAll('path.ps_line')
        .data([p_airfoil.ps_pts])
        .attr('d', function(d) {return line(d)})
        .enter()
        .append('path')
        .attr('class','ps_line')
        .attr('d', function(d) {return line(d)})
        .attr("stroke", "blue")
        .attr("stroke-width", 1.0)
        .attr("fill", "none");
}

function draw_control(){
    draw_thrt_control();
    draw_b1_control();
    draw_b2_control();
    draw_cx_control();
    draw_ct_control();
}

function draw_cx_control(){
    var drag_point = d3.behavior.drag()
        .on('dragstart', function(d) {
            this.parentNode.appendChild(this);
        })
        .on('drag', function(d) {
            var e, x, y;
            e = d3.event;
            x = x_scale.invert(x_scale(d.x) + e.dx);
            // y = d.y + e.y;

            if (x >= 0) {
                // change cx, cy only after we know it's within
                // bounds...this gives smoother movement around the
                // boundaries

                // Update point x value
                d.x = x;

                // Update airfoil
                p_airfoil.cx = d.x + p_airfoil.rte;
                p_airfoil.calc_airfoil();

                // Update geom displayed
                d3.select(this).attr({cx: x_scale(d.x), cy: y_scale(d.y)});

                // zoom_group.selectAll('path.cx_cntrl')
                //     .data([[{x: 0, y: 0}, {x: p_airfoil.cx - p_airfoil.rte, y: 0}]])
                //     .attr('d', function(d) {return line(d)});


                draw_airfoil();
                populate_airfoil_params();
            }
        });

    zoom_group.selectAll('circle.cx_cntrl')
        .data([{x: p_airfoil.cx - p_airfoil.rte, y: 0}])
        .attr('cx', function(d) { return x_scale(d.x); })
        .attr('cy', function(d) { return y_scale(d.y); })
        .enter()
        .append('circle')
        .attr('r', cntrl_pt_radius)
        .attr('cx', function(d) { return x_scale(d.x); })
        .attr('cy', function(d) { return y_scale(d.y); })
        .attr('fill', 'red')
        .attr('class', 'cx_cntrl')
        .call(drag_point);

    // zoom_group.selectAll('path.cx_cntrl')
    //     .data([[{x: 0, y: 0}, {x: p_airfoil.cx - p_airfoil.rte, y: 0}]])
    //     .attr('d', function(d) {return line(d)})
    //     .enter()
    //     .append('path')
    //     .attr('d', function(d) {return line(d)})
    //     .attr('fill', 'red')
    //     .attr('class', 'cx_cntrl')
    //     .attr("stroke", "red")
    //     .attr("stroke-width", 1.0)
    //     .attr("fill", "none");
}

function draw_ct_control(){
    var drag_point = d3.behavior.drag()
        .on('dragstart', function(d) {
            this.parentNode.appendChild(this);
        })
        .on('drag', function(d) {
            var e, x, y;
            e = d3.event;
            x = d.x; // + e.dx/x_scale(1);
            y = y_scale.invert(y_scale(d.y) + e.dy);

            if (y >= 0) {
                // change cx, cy only after we know it's within
                // bounds...this gives smoother movement around the
                // boundaries

                // Update point x value
                d.y = y;

                // Update airfoil
                p_airfoil.ct = d.y;
                p_airfoil.calc_airfoil();

                // Update geom displayed
                d3.select(this).attr({cx: x_scale(d.x), cy: y_scale(d.y)});

                // zoom_group.selectAll('path.ct_cntrl')
                //     .data([[{x: p_airfoil.rle, y: 0}, {x: p_airfoil.rle, y: p_airfoil.ct}]])
                //     .attr('d', function(d) {return line(d)});

                draw_airfoil();
                populate_airfoil_params();
            }
        })

    zoom_group.selectAll('circle.ct_cntrl')
        .data([{x: p_airfoil.rle, y: p_airfoil.ct}])
        .attr('cx', function(d) { return x_scale(d.x); })
        .attr('cy', function(d) { return y_scale(d.y); })
        .enter()
        .append('circle')
        .attr('r', cntrl_pt_radius)
        .attr('cx', function(d) { return x_scale(d.x); })
        .attr('cy', function(d) { return y_scale(d.y); })
        .attr('fill', 'red')
        .attr('class', 'ct_cntrl')
        .call(drag_point);

    // zoom_group.selectAll('path.ct_cntrl')
    //     .data([[{x: p_airfoil.rle, y: 0}, {x: p_airfoil.rle, y: p_airfoil.ct}]])
    //     .attr('d', function(d) {return line(d)})
    //     .enter()
    //     .append('path')
    //     .attr('d', function(d) {return line(d)})
    //     .attr('fill', 'red')
    //     .attr('class', 'ct_cntrl')
    //     .attr("stroke", "red")
    //     .attr("stroke-width", 1.0)
    //     .attr("fill", "none");
}

function draw_thrt_control(){
    var drag_point = d3.behavior.drag()
        .on('dragstart', function(d) {
            this.parentNode.appendChild(this);
        })
        .on('drag', function(d) {
            var e, xnew, ynew, x5, y5, dist, m, b;
            e = d3.event;

            // Get new data
            ynew = y_scale.invert(y_scale(d.y) + e.dy);
            x5 = p_airfoil.pt5.x;
            y5 = p_airfoil.pt5.y + p_airfoil.r*(2*Math.PI/p_airfoil.nb);
            m = (p_airfoil.pt2.y - y5)/(p_airfoil.pt2.x - x5);
            b = y5 - m*x5;
            xnew = (ynew - b)/m;

            // Calc dist from new point to pt5 on the opposite airfoil
            dist = Math.sqrt(Math.pow(x5-xnew, 2) + Math.pow(y5-ynew, 2));

            if (ynew <= y5 && dist > 0) {
                // console.log(dist);
                // Update airfoil
                p_airfoil.o = dist;
                p_airfoil.calc_airfoil();

                d.y = ynew;
                d.x = xnew;

                // Update geom displayed
                d3.select(this).attr({cx: x_scale(d.x), cy: y_scale(d.y)});

                zoom_group.selectAll('path.thrt_cntrl')
                    .data([[
                        p_airfoil.pt2,
                        {x: p_airfoil.pt5.x, y: p_airfoil.pt5.y + p_airfoil.r*(2*Math.PI/p_airfoil.nb)}
                    ]])
                    .attr('d', function(d) {return line(d)});

                draw_airfoil();
                populate_airfoil_params();
            }
        });

    zoom_group.selectAll('circle.thrt_cntrl')
        .data([p_airfoil.pt2])
        .attr('cx', function(d) { return x_scale(d.x); })
        .attr('cy', function(d) { return y_scale(d.y); })
        .enter()
        .append('circle')
        .attr('r', cntrl_pt_radius)
        .attr('cx', function(d) { return x_scale(d.x); })
        .attr('cy', function(d) { return y_scale(d.y); })
        .attr('fill', 'red')
        .attr('class', 'thrt_cntrl')
        .call(drag_point);

    zoom_group.selectAll('path.thrt_cntrl')
        .data([[
            p_airfoil.pt2,
            {x: p_airfoil.pt5.x, y: p_airfoil.pt5.y + p_airfoil.r*(2*Math.PI/p_airfoil.nb)}
            ]])
        .attr('d', function(d) {return line(d)})
        .enter()
        .append('path')
        .attr('d', function(d) {return line(d)})
        .attr('fill', 'red')
        .attr('class', 'thrt_cntrl')
        .attr("stroke", "red")
        .attr("stroke-width", 1.0)
        .attr("fill", "none");
}

function draw_b1_control(){
    var drag_point = d3.behavior.drag()
        .on('dragstart', function(d) {
            this.parentNode.appendChild(this);
        })
        .on('drag', function(d) {
            var e, xnew, ynew, ang, new_pt, back_pt;
            e = d3.event;

            // Get new data
            xnew = x_scale.invert(x_scale(d.x) + e.dx);
            ynew = y_scale.invert(y_scale(d.y) + e.dy);


            // Calc dist from new point to pt5 on the opposite airfoil
            ang = Math.atan2(ynew-p_airfoil.ct, xnew-p_airfoil.rle) + Math.PI;
            // console.log(p_airfoil.b1, ang);

            // Update airfoil
            p_airfoil.b1 = ang;
            p_airfoil.calc_airfoil();

            new_pt = point_at_angle_dist({x: p_airfoil.rle, y: p_airfoil.ct}, ang + Math.PI, 4*p_airfoil.rle);
            back_pt = point_at_angle_dist({x: p_airfoil.rle, y: p_airfoil.ct}, ang, p_airfoil.rle);
            d.y = new_pt.y;
            d.x = new_pt.x;

            // Update geom displayed
            d3.select(this).attr({cx: x_scale(d.x), cy: y_scale(d.y)});

            zoom_group.selectAll('path.b1_cntrl')
                .data([[
                    new_pt,
                    back_pt
                ]])
                .attr('d', function(d) {return line(d)});

            draw_airfoil();
            populate_airfoil_params();
        });

    var circ_cntr = {x: p_airfoil.rle, y: p_airfoil.ct};
    var back_pt = point_at_angle_dist({x: p_airfoil.rle, y: p_airfoil.ct}, p_airfoil.b1, p_airfoil.rle);
    var cntrl_pt = point_at_angle_dist(circ_cntr, p_airfoil.b1 + Math.PI, 4*p_airfoil.rle);

    zoom_group.selectAll('circle.b1_cntrl')
        .data([cntrl_pt])
        .attr('cx', function(d) { return x_scale(d.x); })
        .attr('cy', function(d) { return y_scale(d.y); })
        .enter()
        .append('circle')
        .attr('r', cntrl_pt_radius)
        .attr('cx', function(d) { return x_scale(d.x); })
        .attr('cy', function(d) { return y_scale(d.y); })
        .attr('fill', 'red')
        .attr('class', 'b1_cntrl')
        .call(drag_point);

    zoom_group.selectAll('path.b1_cntrl')
        .data([[cntrl_pt, back_pt]])
        .attr('d', function(d) {return line(d)})
        .enter()
        .append('path')
        .attr('d', function(d) {return line(d)})
        .attr('fill', 'red')
        .attr('class', 'b1_cntrl')
        .attr("stroke", "red")
        .attr("stroke-width", 1.0)
        .attr("fill", "none");
}

function draw_b2_control(){
    var drag_point = d3.behavior.drag()
        .on('dragstart', function(d) {
            this.parentNode.appendChild(this);
        })
        .on('drag', function(d) {
            var e, xnew, ynew, ang, new_pt, back_pt;
            e = d3.event;

            // Get new data
            xnew = x_scale.invert(x_scale(d.x) + e.dx);
            ynew = y_scale.invert(y_scale(d.y) + e.dy);


            // Calc dist from new point to pt5 on the opposite airfoil
            ang = Math.atan2(ynew, xnew-(p_airfoil.cx - p_airfoil.rte));
            // console.log(p_airfoil.b2, ang);

            // Update airfoil
            p_airfoil.b2 = ang;
            p_airfoil.calc_airfoil();

            new_pt = point_at_angle_dist({x: p_airfoil.cx - p_airfoil.rte, y: 0}, ang, 5*p_airfoil.rte);
            back_pt = point_at_angle_dist({x: p_airfoil.cx - p_airfoil.rte, y: 0}, ang + Math.PI, p_airfoil.rte);
            d.y = new_pt.y;
            d.x = new_pt.x;

            // Update geom displayed
            d3.select(this).attr({cx: x_scale(d.x), cy: y_scale(d.y)});

            zoom_group.selectAll('path.b2_cntrl')
                .data([[
                    new_pt,
                    back_pt
                ]])
                .attr('d', function(d) {return line(d)});

            draw_airfoil();
            populate_airfoil_params();
        });

    var circ_cntr = {x: p_airfoil.cx - p_airfoil.rte, y: 0};
    var back_pt = point_at_angle_dist(circ_cntr, p_airfoil.b2 + Math.PI, p_airfoil.rte);
    var cntrl_pt = point_at_angle_dist(circ_cntr, p_airfoil.b2, 5*p_airfoil.rte);

    zoom_group.selectAll('circle.b2_cntrl')
        .data([cntrl_pt])
        .attr('cx', function(d) { return x_scale(d.x); })
        .attr('cy', function(d) { return y_scale(d.y); })
        .enter()
        .append('circle')
        .attr('r', cntrl_pt_radius)
        .attr('cx', function(d) { return x_scale(d.x); })
        .attr('cy', function(d) { return y_scale(d.y); })
        .attr('fill', 'red')
        .attr('class', 'b2_cntrl')
        .call(drag_point);

    zoom_group.selectAll('path.b2_cntrl')
        .data([[cntrl_pt, back_pt]])
        .attr('d', function(d) {return line(d)})
        .enter()
        .append('path')
        .attr('d', function(d) {return line(d)})
        .attr('fill', 'red')
        .attr('class', 'b2_cntrl')
        .attr("stroke", "red")
        .attr("stroke-width", 1.0)
        .attr("fill", "none");
}


// TUTORIAL INFORMATION
tutorialSteps = [
    {
        template: Template.tutorial_step1,
        spot: '.airfoil_name_div',
        onLoad: function() { console.log("The tutorial has started!"); }
    },
    {
        template: Template.tutorial_step2,
        spot: '.js-save-airfoil',
        onLoad: function() {
            return;
        }
    },
    {
        template: Template.tutorial_step3,
        spot: '.js-update-privacy',
        onLoad: function() {
            return;
        }
    },
    {
        template: Template.tutorial_step4,
        spot: '.parameter_sidebar',
        onLoad: function() {
            return;
        }
    },
    {
        template: Template.tutorial_step5,
        spot: '#airfoil_section',
        onLoad: function() {
            return;
        }
    },
    {
        template: Template.tutorial_step6,
        spot: '#airfoil_section',
        onLoad: function() {
            return;
        }
    },
    {
        template: Template.tutorial_step7,
        spot: '#airfoil_section',
        onLoad: function() {
            return;
        }
    },
    {
        template: Template.tutorial_step8,
        spot: '#airfoil_section',
        onLoad: function() {
            return;
        }
    },
    {
        template: Template.tutorial_step9,
        spot: '#airfoil_section',
        onLoad: function() {
            return;
        }
    },
    {
        template: Template.tutorial_step10,
        spot: '#airfoil_section',
        onLoad: function() {
            return;
        }
    },
    {
        template: Template.tutorial_step11,
        spot: '#airfoil_section',
        onLoad: function() {
            return;
        }
    },
    {
        template: Template.tutorial_step12,
        spot: '#airfoil_section',
        onLoad: function() {
            return;
        }
    }
];

Template.design_page.helpers({
    tutorialEnabled: function() {
        return Session.get('tutorialEnabled');
    },
    options: {
        id: "designPageTutorial",
        steps: tutorialSteps,
        emitter: new EventEmitter(),
        onFinish: function() {
            console.log("Finished Tutorial!");
            Meteor.setTimeout( function () {
                // Test debouncing
                Session.set('tutorialEnabled', false);
            }, 1000);
        }
    }
});