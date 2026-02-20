import { State } from './state.js';

export const Auth = {
    isLoggedIn() {
        return State.getAuthFlag();
    },

    login() {
        State.setAuthFlag(true);
    },

    logout() {
        State.setAuthFlag(false);
    }
};
