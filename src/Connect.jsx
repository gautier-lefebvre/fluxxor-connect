/**
 * @module fluxxor-connect
 */

const forEach = require('lodash.foreach');
const merge = require('lodash.merge');
const reduce = require('lodash.reduce');
const isEqual = require('lodash.isequal');
const isBoolean = require('lodash.isboolean');
const keys = require('lodash.keys');
const get = require('lodash.get');

const React = require('react');
const createReactClass = require('create-react-class');
const Fluxxor = require('fluxxor');

const FluxMixin = Fluxxor.FluxMixin(React);

/**
 * Transform store values into a calculated state for your component
 * @callback ConnectParameter~connectState
 * @param {object} store - The Fluxxor store component or any object than hold wanted values
 * @returns {object} - The calculated state
 */

/**
 * @typedef {object} ConnectParameter
 * @property {string} store - The name of your store, for example 'AUTH_STORE'
 * @property {ConnectParameter~connectState} state - Transform store values
 * into a calculated state for your component
 * @property {string} event - The event the store emits
 * and that you want to listen to ('change' by default)
 */

/**
 * @typedef {function} ConnectHighOrderComponent
 * @param {React.Component} Component
 * @returns {object}
 */

/**
 *  @typedef {function} Connect
 *  @param {...ConnectParameter} params -
 *  { store: 'STORE_NAME', state: store => ({ a: store.a }), event: '' }
 *  @returns {ConnectHighOrderComponent}
 */
module.exports = (...params) => Component => createReactClass({
  displayName: 'FluxxorConnect',

  mixins: [
    // put flux from fluxxor into the component
    FluxMixin,
  ],

  getInitialState() {
    // initialize the component state from the given store
    return this.getStateFromFlux();
  },

  componentWillMount() {
    const flux = this.getFlux();

    // init wrapped component
    this.wrappedInstance = null;

    this.mounted = true;

    this.callbacks = [];

    // for each given store
    // listen to the given event (or 'change' by default) and update the state
    forEach(params, (storeAndState) => {
      // get the store or list of stores
      const store = Array.isArray(storeAndState.store) ?
        storeAndState.store.map(storeName => flux.store(storeName))
        : flux.store(storeAndState.store);

      const watchedProps = this.getProps(storeAndState.watchedProps);

      const reference = (props) => {
        // we check if the component is still mounted just in case
        if (this.mounted) {
          const p = props || this.props;

          // store is either an array or a single store
          this.setState(storeAndState.state.call(this, store, p));
        }
      };

      const events = this.getEvents(storeAndState.event, store);

      // listen for the events
      if (Array.isArray(store)) {
        forEach(store, (s, idx) => {
          forEach(events[idx], (event) => {
            s.on(event, reference);
          });
        });
      } else {
        forEach(events, (event) => {
          store.on(event, reference);
        });
      }

      // we store the callback reference so we can unsubscribe later
      this.callbacks.push({ store, reference, events, watchedProps });
    });
  },

  componentWillReceiveProps(nextProps) {
    // for each watched store, update if a watched prop has changed
    forEach(this.callbacks, (callback) => {
      let hasChanged = false;

      // check each watched prop individually
      // we can't use 'pick(nextProps, callback.watchedProps)
      // because it does not work with nested prop names ('props.foo.bar')
      forEach(callback.watchedProps, (propName) => {
        const nextWatchedProp = get(nextProps, propName);
        const currentWatchedProp = get(this.props, propName);

        // if a prop changed, call the given 'state' function with next props
        if (!isEqual(nextWatchedProp, currentWatchedProp)) {
          hasChanged = true;
        }

        return !hasChanged;
      });

      if (hasChanged) {
        callback.reference(nextProps);
      }
    });
  },

  componentWillUnmount() {
    this.mounted = false;

    // we unsubscribe from the events we subscribed to in componentWillMount
    forEach(this.callbacks, (callback) => {
      if (Array.isArray(callback.store)) {
        forEach(callback.store, (s, idx) => {
          forEach(callback.events[idx], (event) => {
            s.removeListener(event, callback.reference);
          });
        });
      } else {
        forEach(callback.events, (event) => {
          callback.store.removeListener(event, callback.reference);
        });
      }
    });
  },

  getStateFromFlux() {
    const flux = this.getFlux();

    // we merge all given stores' state
    return reduce(
      params,
      (state, storeAndState) => merge(
        state,
        storeAndState.state.call(
          this,
          flux.store(storeAndState.store),
          this.props,
        ),
      ),
      {},
    );
  },

  // returns the wrapped component so the parent component can use refs
  getWrappedInstance() {
    return this.wrappedInstance;
  },

  // sets the wrapped component using react refs
  setWrappedInstance(el) {
    this.wrappedInstance = el;
  },

  getProps(props) {
    // if the parameter is a string, return an array with one entry
    // else if the parameter is an array, return the parameter
    // else return null
    if (Array.isArray(props) && !!props.length) {
      return props;
    } else if (typeof props === 'string') {
      return [props];
    } else if (isBoolean(props) && !!props) {
      return keys(this.props);
    }

    return null;
  },

  getEvents(events, store) {
    if (!Array.isArray(store)) {
      if (Array.isArray(events)) {
        return events;
      } else if (typeof events === 'string') {
        return [events];
      }

      return ['change'];
    }

    // if no events, listen for 'change' on every store
    if (!events) {
      return store.map(() => (['change']));
    }

    return store.map((s, idx) => this.getEvents(events[idx], s));
  },

  render() {
    return (
      <Component
        {...this.props}
        {...this.state}
        ref={this.setWrappedInstance}
        flux={this.getFlux()}
      />
    );
  },
});
