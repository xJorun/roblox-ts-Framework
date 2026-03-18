import { Workspace } from "@rbxts/services";
import { Controller } from "client/core/Controller";
import { Logger } from "shared/core/Logger";

export interface CameraConfig {
	offset: Vector3;
	fov: number;
	smoothing: number;
}

const DEFAULT_CAMERA_CONFIG: CameraConfig = {
	offset: new Vector3(0, 10, -15),
	fov: 70,
	smoothing: 0.15,
};

export class CameraController implements Controller {
	readonly name = "CameraController";
	private readonly log = new Logger("CameraController");
	private config = DEFAULT_CAMERA_CONFIG;
	private target: BasePart | undefined;

	onStart(): void {
		const camera = Workspace.CurrentCamera;
		if (camera) {
			camera.FieldOfView = this.config.fov;
		}

		this.log.info("Camera controller ready");
	}

	setTarget(part: BasePart | undefined): void {
		this.target = part;
	}

	setConfig(config: Partial<CameraConfig>): void {
		if (config.offset !== undefined) this.config.offset = config.offset;
		if (config.fov !== undefined) this.config.fov = config.fov;
		if (config.smoothing !== undefined) this.config.smoothing = config.smoothing;
	}
}
