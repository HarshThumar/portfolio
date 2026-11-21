// Every ground is an ellipse described by its boundary rope. Stands, walls, crowd, the SIX
// trigger and floodlights are all placed relative to it, so one shape drives a whole ground.
export interface FieldShape {
  /** Rope semi-axis along x, in metres. */
  rx: number;
  /** Rope semi-axis along z, in metres. */
  rz: number;
}

/** Lord's and the other project grounds (an oval). */
export const PROJECT_FIELD: FieldShape = { rx: 42, rz: 50 };

/** Narendra Modi Stadium, Ahmedabad: the hub. Round and bigger, to hold nine ground models. */
export const HUB_FIELD: FieldShape = { rx: 60, rz: 60 };
