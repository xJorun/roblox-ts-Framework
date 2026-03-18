import { Logger, setGlobalLogLevel, LogLevel } from "shared/core/Logger";

import { ClientNetwork } from "client/networking/ClientNet";
import { ControllerRegistry } from "client/core/ControllerRegistry";

import { InputController } from "client/controllers/input/InputController";
import { CameraController } from "client/controllers/camera/CameraController";
import { UIController } from "client/controllers/ui/UIController";
import { EffectsController } from "client/controllers/effects/EffectsController";
import { PredictionController } from "client/controllers/prediction/PredictionController";

const log = new Logger("Client");
setGlobalLogLevel(LogLevel.Info);

log.info("Bootstrapping client...");

// --- Infrastructure ---
const network = new ClientNetwork();
const registry = new ControllerRegistry();

// --- Controllers ---
const inputController = new InputController();
const cameraController = new CameraController();
const uiController = new UIController(network);
const effectsController = new EffectsController(network);
const predictionController = new PredictionController(network, inputController);

// --- Register ---
registry
	.register(inputController)
	.register(cameraController)
	.register(uiController)
	.register(effectsController)
	.register(predictionController);

// --- Boot ---
network.initialize();
registry.start();

log.info("Client ready");
