import { joinList } from "../src/lib/listFirestore";
import { QUEUE_COLLECTION } from "../src/lib/eventConfig";

async function runLoadTest() {
  console.log("Starting load test (500 concurrent submissions)...");
  
  const promises = [];
  const start = Date.now();
  
  for (let i = 0; i < 500; i++) {
    const studentId = String(1000000 + i);
    promises.push(
      joinList("queue", {
        fullName: `Test User ${i}`,
        studentId,
        studentEmail: `${studentId}@sd.taylors.edu.my`,
        personalEmail: `test${i}@gmail.com`,
        phoneNumber: "0123456789",
        collectDetails: {
          date: QUEUE_COLLECTION.dateKey,
          timeslot: QUEUE_COLLECTION.timeslots[0].key,
        }
      }).catch((e) => e.message)
    );
  }

  const results = await Promise.all(promises);
  const end = Date.now();
  
  const successCount = results.filter(r => r === undefined).length;
  const slotFullCount = results.filter(r => r === "Slot full").length;
  const otherErrors = results.filter(r => r !== undefined && r !== "Slot full");
  
  console.log(`Load test completed in ${end - start}ms`);
  console.log(`Successful registrations: ${successCount}`);
  console.log(`"Slot full" rejections: ${slotFullCount}`);
  console.log(`Other errors:`, otherErrors.reduce((acc, curr) => {
    acc[curr] = (acc[curr] || 0) + 1;
    return acc;
  }, {} as Record<string, number>));
}

runLoadTest();
