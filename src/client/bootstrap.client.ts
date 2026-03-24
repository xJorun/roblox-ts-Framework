import { setGlobalLogLevel, LogLevel } from "shared/core/Logger";

import { ClientNetwork } from "client/networking/ClientNet";
import { ControllerRegistry } from "client/core/ControllerRegistry";

import { InputController } from "client/controllers/input/InputController";
import { UIController } from "client/controllers/ui/UIController";
import { PredictionController } from "client/controllers/prediction/PredictionController";

setGlobalLogLevel(LogLevel.Info);

const network = new ClientNetwork();
const registry = new ControllerRegistry();

const inputController = new InputController();
const uiController = new UIController(network);
const predictionController = new PredictionController(network, inputController);

registry
	.register(inputController)
	.register(uiController)
	.register(predictionController);

network.initialize();
registry.start();
