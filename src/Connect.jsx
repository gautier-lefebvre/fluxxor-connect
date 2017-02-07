'use strict';

const forEach = require('lodash.foreach');
const merge = require('lodash.merge');
const isFunction = require('lodash.isfunction');
const reduce = require('lodash.reduce');
const React = require('react');
const Fluxxor = require('fluxxor');

const FluxMixin = Fluxxor.FluxMixin(React);

/**
 *  @param params - { store: 'STORE_NAME', state: store => ({ a: store.a }), event: '' }
 */
module.exports = (...params) => Component => React.createClass({
    displayName: 'FluxxorConnect',

    mixins: [
        // put flux from fluxxor into the component
        FluxMixin
    ],

    getInitialState: function () {
        // initialize the component state from the given store
        return this.getStateFromFlux();
    },

    componentWillMount: function () {
        const flux = this.getFlux();

        this.mounted = true;

        this.callbacks = [];

        // for each given store
        // listen to the given event (or 'change' by default) and update the state
        forEach(params, storeAndState => {
            const store = flux.store(storeAndState.store);
            let event = storeAndState.event || 'change';

            const reference = () => {
                // we check if the component is still mounted just in case
                if (this.mounted) {
                    this.setState(storeAndState.state.call(this, store, this.props));
                }
            };

            // listen to the event
            store.on(event, reference);

            // we store the callback reference so we can unsubscribe later
            this.callbacks.push({ store, reference, event });
        });
    },

    componentWillUnmount: function () {
        const flux = this.getFlux();

        this.mounted = false;

        // we unsubscribe from the events we subscribed to in componentWillMount
        forEach(this.callbacks, callback => {
            callback.store.removeListener(callback.event, callback.reference);
        });
    },

    getStateFromFlux: function () {
        const flux = this.getFlux();

        // we merge all given stores' state
        return reduce(
            params,
            (state, storeAndState) => {
                return merge(state, storeAndState.state.call(this, flux.store(storeAndState.store), this.props));
            },
            {}
        );
    },

    render: function () {
        return (
            <Component
                {...this.props}
                {...this.state}
                flux={this.getFlux()}
            />
        );
    }
});
