export default function(namespace, duckName) {
  const methodNames = ["GET", "POST", "PUT", "PATCH", "DELETE"];
  const phases = ["REQUEST", "SUCCESS", "ERROR"];
  const normalizedNamespace = namespace.toLowerCase();
  const normalizedDuckName = duckName.toLowerCase();

  const actionTypes = methodNames.reduce((actionTypes, methodName) => {
    return phases.reduce((newActionTypes, phase) => {
      const actionType = `${methodName}_${phase}`;
      const value = `${normalizedNamespace}/${normalizedDuckName}/${actionType}`;
      newActionTypes[actionType] = value;
      return newActionTypes;
    }, actionTypes);
  }, {});

  function dataReducer(state = {}, { type, payload } = {}) {
    const isBulk = Array.isArray(payload);
    const ids = isBulk ? payload.map(({ id }) => id) : [];
    switch (type) {
      case actionTypes["GET_SUCCESS"]:
      case actionTypes["POST_SUCCESS"]:
      case actionTypes["PUT_SUCCESS"]:
      case actionTypes["PATCH_SUCCESS"]:
        if (!isBulk) return { ...state, [payload.id]: payload };
        return {
          ...state,
          ...payload.reduce((items, item) => {
            items[item.id] = item;
            return items;
          }, {})
        };
      case actionTypes["DELETE_SUCCESS"]:
        if (!isBulk) {
          return Object.keys(state).reduce((items, stateItemId) => {
            if (stateItemId != payload.id)
              items[stateItemId] = state[stateItemId];
            return items;
          }, {});
        }
        return Object.keys(state).reduce((items, stateItemId) => {
          if (!ids.find(itemId => itemId == stateItemId)) {
            items[stateItemId] = state[stateItemId];
          }
          return items;
        }, {});
      default:
        return state;
    }
  }

  function parentReducer(state = {}, action = {}) {
    const { data } = state;
    return { ...state, data: dataReducer(data, action) };
  }

  const actionCreators = Object.keys(actionTypes).reduce(
    (actionCreators, actionType) => {
      const actionCreatorName = actionType
        .replace("_", " ")
        .toLowerCase()
        .replace(/\W+(.)/g, (undefined, character) => {
          return character.toUpperCase();
        });

      const actionCreator = (payload, options = {}) => {
        let action = { ...options, type: actionTypes[actionType] };
        if (payload) action = { ...action, payload };
        return action;
      };

      actionCreators[actionCreatorName] = actionCreator;

      return actionCreators;
    },
    {}
  );

  return {
    namespace: normalizedNamespace,
    name: normalizedDuckName,
    reducer: parentReducer,
    actionCreators
  };
}
