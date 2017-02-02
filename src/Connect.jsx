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
        FluxMixin
    ],

    getInitialState: function () {
        return this.getStateFromFlux();
    },

    componentWillMount: function () {
        const flux = this.getFlux();

        this.mounted = true;

        this._getStateFromFlux = () => {
            if (this.mounted) {
                this.getStateFromFlux && this.setState(this.getStateFromFlux());
            }
        };

        forEach(params, storeAndState => {
            flux.store(storeAndState.store).on(storeAndState.event || 'change', this._getStateFromFlux);
        });
    },

    componentWillUnmount: function () {
        const flux = this.getFlux();

        this.mounted = false;

        forEach(params, storeAndState => {
            flux.store(storeAndState.store).removeListener(storeAndState.event || 'change', this._getStateFromFlux);
        });
    },

    getStateFromFlux: function () {
        const flux = this.getFlux();

        return reduce(
            params,
            (state, storeAndState) => {
                if (!isFunction(storeAndState.state)) {
                    return state;
                }

                return merge(state, storeAndState.state.call(this, flux.store(storeAndState.store), this.props));
            },
            {});
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
