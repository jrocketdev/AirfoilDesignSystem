import { Meteor } from 'meteor/meteor';

Meteor.startup(() => {
    //todo: Add in in roles information. Check for admin user and make admin. Make all others "general" or something
    // https://atmospherejs.com/alanning/roles
    // I've already installed the required package. Just need to configure it properly.

    // Check to see if we have airfoils. If not, add some tester foils.
    if (!Airfoils.findOne()){// no documents yet!
        Airfoils.insert({
            name: "Tester Airfoil 1",
            private: false,
            creator: "admin",
            parameters: {
                r: 5.5,
                cx: 1.1770463454605378,
                ct: 0.466704490331039,
                uct: 0.11344640137963143,
                b1: 0.6108652381980153,
                db1: 0.6981317007977318,
                rle: 0.031,
                b2: -0.9948376736367678,
                rte: 0.016,
                nb: 51,
                o: 0.337
            }
        });

        Airfoils.insert({
            name: "Tester Airfoil 2",
            private: false,
            creator: "admin",
            parameters: {
                r : 5.5,
                cx : 1.102,
                ct : 0.2884694198623389,
                uct : 0.11344640137963143,
                b1 : 0.9031539343556485,
                db1 : 0.5235987755982988,
                rle : 0.015,
                b2 : -0.9948376736367678,
                rte : 0.016,
                nb : 51,
                o : 0.337
            }
        });

        Airfoils.insert({
            name: "Tester Airfoil 3",
            private: false,
            creator: "admin",
            parameters: {
                r: 5.5,
                cx : 1.102,
                ct : 0.9169825630940586,
                uct : 0.11344640137963143,
                b1 : 0.08100578809542336,
                db1 : 0.2792526803190927,
                rle : 0.031,
                b2 : -1.110974424367005,
                rte : 0.016,
                nb : 51,
                o : 0.27121406695590505
            }
        });

        Airfoils.insert({
            name: "Tester Airfoil 4",
            private: false,
            creator: "admin",
            parameters: {
                r : 5.5,
                cx : 1.102,
                ct : 0.591,
                uct : 0.11344640137963143,
                b1 : 0.6108652381980153,
                db1 : 0.2792526803190927,
                rle : 0.031,
                b2 : -0.9948376736367678,
                rte : 0.016,
                nb : 51,
                o : 0.337
            }
        });
    }
});
