
CREATE TABLE IF NOT EXISTS "PATIENTS" (
	"id" serial NOT NULL UNIQUE,
	"email" varchar(255) NOT NULL UNIQUE,
	"name" varchar(255) NOT NULL,
	"phone" decimal NOT NULL,
	"address" varchar(255) NOT NULL,
	PRIMARY KEY("id")
);


CREATE TABLE IF NOT EXISTS "  APPOINTMENTS " (
	"id" serial NOT NULL UNIQUE,
	"appoinment_id" varchar(255) NOT NULL UNIQUE,
	"patients_id" int NOT NULL,
	"doctor_id" int NOT NULL,
	"treatment_id" int NOT NULL,
	"insurance_id" int NOT NULL,
	"appoinment_date" date NOT NULL,
	"treatment_cost" decimal NOT NULL,
	"amount_paid" decimal NOT NULL,
	PRIMARY KEY("id")
);

CREATE INDEX "  APPOINTMENTS _index_0"
ON "  APPOINTMENTS " ();
CREATE TABLE IF NOT EXISTS " DOCTORS " (
	"id" serial NOT NULL UNIQUE,
	"email" varchar(255) NOT NULL UNIQUE,
	"name" varchar(255) NOT NULL,
	"specialty" varchar(255) NOT NULL,
	PRIMARY KEY("id")
);


CREATE TABLE IF NOT EXISTS "   INSURANCES " (
	"id" serial NOT NULL UNIQUE,
	"name" varchar(255) NOT NULL UNIQUE,
	"coverage_%" decimal,
	PRIMARY KEY("id")
);


CREATE TABLE IF NOT EXISTS "    TREATMENTS " (
	"id" serial NOT NULL UNIQUE,
	"code" int NOT NULL UNIQUE,
	"descript" varchar(255) NOT NULL,
	"cost" decimal,
	PRIMARY KEY("id")
);


ALTER TABLE "  APPOINTMENTS "
ADD FOREIGN KEY("patients_id") REFERENCES "PATIENTS"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "  APPOINTMENTS "
ADD FOREIGN KEY("doctor_id") REFERENCES " DOCTORS "("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "  APPOINTMENTS "
ADD FOREIGN KEY("treatment_id") REFERENCES "    TREATMENTS "("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "  APPOINTMENTS "
ADD FOREIGN KEY("insurance_id") REFERENCES "   INSURANCES "("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;