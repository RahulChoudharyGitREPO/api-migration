import { Injectable } from '@nestjs/common';

@Injectable()
export class DashboardService {

  getSgifProjectList() {
    const allData = [
      {
        maleFarmers: 1422,
        femaleFarmers: 586,
        totalFarmers: 2008,
        farmersInLivelihood: 3,
        totalPlantingReportPlanted: 133993,
        totalNoOfPlants: 12972,
        totalPlantedSurvivability: 21392,
        maleFarmerPercentage: "71",
        femaleFarmerPercentage: "29",
        survivalPercentage: "16",
        beneficiaryPercentage: "0",
        treesPlantedPercentage: "10",
        projectDetails: {
          duration: {
            value: "1",
            unit: "years",
          },
          _id: "67973db0479bbe215019b45f",
          trackingNumber: "INDUSTOWERSAGRO2024",
          acres: 220,
          noOfPlants: 110000,
          startingDate: "2024-11-10T18:30:00.000Z",
          createdBy: "6797301c479bbe215019b41e",
          deleted: false,
          createdAt: "2025-01-27T08:02:56.204Z",
          updatedAt: "2025-01-27T08:02:56.204Z",
          __v: 0,
          donorCode: "INDUSTOWER001",
        },
        app: "Indus Towers",
        basePath: "/sgif",
        clientUrl: "https://app.leafledger.in",
        features: {
          dashboard: [],
          reports: ["Operations"],
        },
        platform: "SGIF",
      },
      {
        maleFarmers: 0,
        femaleFarmers: 0,
        totalFarmers: 0,
        farmersInLivelihood: 0,
        totalPlantingReportPlanted: 0,
        totalNoOfPlants: 0,
        totalPlantedSurvivability: 0,
        maleFarmerPercentage: "0",
        femaleFarmerPercentage: "0",
        survivalPercentage: "0",
        beneficiaryPercentage: "0",
        treesPlantedPercentage: "0",
        projectDetails: {
          duration: {
            value: "1",
            unit: "years",
          },
          _id: "67973dde479bbe215019b462",
          trackingNumber: "INDUSTOWERSPAPAYA",
          acres: 50,
          noOfPlants: 40000,
          startingDate: "2024-11-10T18:30:00.000Z",
          createdBy: "6797301c479bbe215019b41e",
          deleted: false,
          createdAt: "2025-01-27T08:03:42.927Z",
          updatedAt: "2025-01-27T08:03:42.927Z",
          __v: 0,
          donorCode: "INDUSTOWER001",
        },
        app: "Indus Towers",
        basePath: "/sgif",
        clientUrl: "https://app.leafledger.in",
        features: {
          dashboard: [],
          reports: ["Operations"],
        },
        platform: "SGIF",
      },
    ];

    return {
      success: true,
      data: allData,
    };
  }

  getKyProjectList() {
    const allData = [];

    return {
      success: true,
      data: allData,
    };
  }
}
