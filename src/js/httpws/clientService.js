import {EventEmitter} from "./common"

 class ClientService extends EventEmitter {
    constructor() {
        super();
    }

    addRequestListener(requestListener) {
        this.addListener('request', requestListener);
    }

    removeRequestListener(requestListener) {
        this.removeListener('request', requestListener);
    }
}

export default ClientService;
