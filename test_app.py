import unittest

from app import app


class DepotApiTests(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_home_page_loads(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)

    def test_depot_filter(self):
        response = self.client.get("/api/depots?district=Chennai")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.get_json()), 3)

    def test_stats(self):
        response = self.client.get("/api/stats")
        self.assertEqual(response.get_json()["activeDepots"], 42)


if __name__ == "__main__":
    unittest.main()
